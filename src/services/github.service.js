import { Platform } from 'react-native';

const GITHUB_OWNER = process.env.EXPO_PUBLIC_GITHUB_OWNER || 'NataliaOsorioL';
const GITHUB_REPO = process.env.EXPO_PUBLIC_GITHUB_REPO || 'tulook';
const GITHUB_BRANCH = 'main';

function getToken() {
  const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN;
  if (!token) {
    console.warn('[GitHub] Token no configurado. Crea un archivo .env con EXPO_PUBLIC_GITHUB_TOKEN.');
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
    throw new Error(
      `Error al subir imagen a GitHub (${response.status}): ${errorBody.message || 'Intenta de nuevo'}`,
    );
  }

  const data = await response.json();
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
    console.warn('[GitHub] No se puede eliminar imagen: token no configurado.');
    return;
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
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
      console.warn(
        `[GitHub] No se pudo eliminar la imagen (${response.status}): ${errorBody.message || 'Error desconocido'}`,
      );
    }
  } catch (err) {
    console.warn('[GitHub] Error al eliminar imagen:', err.message);
  }
}

export function getPublicImageUrl(githubPath) {
  if (!githubPath) return null;
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;
}