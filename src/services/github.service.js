import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const GITHUB_OWNER = process.env.EXPO_PUBLIC_GITHUB_OWNER || 'NataliaOsorioL';
const GITHUB_REPO = process.env.EXPO_PUBLIC_GITHUB_REPO || 'tulook';
const GITHUB_BRANCH = process.env.EXPO_PUBLIC_GITHUB_BRANCH || 'master';

function getToken() {
  const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN;
  if (!token) {
    logger.warn('[GitHub] Token no configurado. Crea un archivo .env con EXPO_PUBLIC_GITHUB_TOKEN.');
    return null;
  }
  return token;
}

async function uriToBase64(localUri) {
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const FileSystem = await import('expo-file-system');
  return FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Verifica que el repositorio, token y rama sean válidos antes de operar.
 * Llamada opcional — útil al iniciar la app para detectar configuraciones erróneas.
 */
export async function verifyGitHubSetup() {
  const token = getToken();
  if (!token) {
    return { ok: false, error: 'TOKEN_NOT_CONFIGURED', message: 'Token no configurado' };
  }

  // 1. Verificar que el repo existe y el token tiene acceso
  const repoUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  let response;
  try {
    response = await fetch(repoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    return { ok: false, error: 'NETWORK_ERROR', message: `Error de red: ${err.message}` };
  }

  if (response.status === 401) {
    return { ok: false, error: 'TOKEN_INVALID', message: 'Token inválido o revocado. Genera uno nuevo en GitHub.' };
  }
  if (response.status === 403) {
    return { ok: false, error: 'TOKEN_NO_ACCESS', message: 'El token no tiene acceso al repositorio. Verifica los permisos.' };
  }
  if (response.status === 404) {
    return { ok: false, error: 'REPO_NOT_FOUND', message: `Repositorio ${GITHUB_OWNER}/${GITHUB_REPO} no encontrado. Verifica owner y repo.` };
  }
  if (!response.ok) {
    return { ok: false, error: 'REPO_CHECK_FAILED', message: `Error al verificar repo (HTTP ${response.status})` };
  }

  const repoData = await response.json();
  const defaultBranch = repoData.default_branch;

  // 2. Verificar que la rama configurada existe
  const branchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches/${GITHUB_BRANCH}`;
  const branchResp = await fetch(branchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (branchResp.status === 404) {
    return {
      ok: false, error: 'BRANCH_NOT_FOUND',
      message: `La rama "${GITHUB_BRANCH}" no existe. La rama por defecto del repo es "${defaultBranch}". Actualiza EXPO_PUBLIC_GITHUB_BRANCH en .env a "${defaultBranch}".`,
      defaultBranch,
    };
  }
  if (!branchResp.ok) {
    return { ok: false, error: 'BRANCH_CHECK_FAILED', message: `Error al verificar rama (HTTP ${branchResp.status})` };
  }

  logger.debug(`[GitHub] Configuración válida: ${GITHUB_OWNER}/${GITHUB_REPO} rama "${GITHUB_BRANCH}"`);
  return { ok: true, defaultBranch };
}

function buildError(status, errorBody) {
  const msg = errorBody?.message || '';
  switch (status) {
    case 401:
      return `Error de autenticación (401): Token inválido o revocado. Genera uno nuevo en GitHub.`;
    case 403:
      return `Permiso denegado (403): El token no tiene permisos de escritura en ${GITHUB_OWNER}/${GITHUB_REPO}. Requiere: Contents > Read and Write.`;
    case 404:
      if (msg.includes('Branch')) {
        return `Rama incorrecta (404): La rama "${GITHUB_BRANCH}" no existe en ${GITHUB_OWNER}/${GITHUB_REPO}. Verifica EXPO_PUBLIC_GITHUB_BRANCH en .env.`;
      }
      return `Ruta no encontrada (404): ${msg || 'Verifica owner, repo y ruta.'}`;
    case 409:
      return `Conflicto (409): ${msg || 'El archivo ya existe o hay un conflicto de SHA.'}`;
    case 422:
      return `Error de validación (422): ${msg || 'El contenido o la solicitud no es válida.'}`;
    default:
      return `Error al subir imagen a GitHub (${status}): ${msg || 'Intenta de nuevo'}`;
  }
}

export async function uploadImageToGitHub(userId, localUri) {
  const token = getToken();
  if (!token) {
    throw new Error(
      'No se pudo subir la imagen: token de GitHub no configurado. ' +
      'Agrega EXPO_PUBLIC_GITHUB_TOKEN en tu archivo .env',
    );
  }

  const base64Content = await uriToBase64(localUri);
  const path = `garments/${userId}/${Date.now()}.jpg`;
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  logger.debug(`[GitHub] Subiendo imagen a: ${GITHUB_OWNER}/${GITHUB_REPO}/${path} (rama: ${GITHUB_BRANCH})`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add garment image for user ${userId}`,
      content: base64Content,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(buildError(response.status, errorBody));
  }

  const data = await response.json();
  logger.debug(`[GitHub] Imagen subida exitosamente: ${data.content.path}`);
  return {
    download_url: data.content.download_url,
    sha: data.content.sha,
    path: data.content.path,
  };
}

export async function deleteImageFromGitHub(path, sha) {
  if (!path || !sha) return;

  const token = getToken();
  if (!token) {
    logger.warn('[GitHub] No se puede eliminar imagen: token no configurado.');
    return;
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    logger.debug(`[GitHub] Eliminando imagen: ${path}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete garment image: ${path}`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      logger.warn(
        `[GitHub] No se pudo eliminar la imagen (${response.status}): ${errorBody.message || 'Error desconocido'}`,
      );
    } else {
      logger.debug(`[GitHub] Imagen eliminada: ${path}`);
    }
  } catch (err) {
    logger.warn('[GitHub] Error al eliminar imagen:', err.message);
  }
}

export function getPublicImageUrl(githubPath) {
  if (!githubPath) return null;
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;
}