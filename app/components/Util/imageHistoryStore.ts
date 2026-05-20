type Listener = () => void;

const listeners: Listener[] = [];
let currentUrl: string | null = null;
const history: string[] = [];

export function recordImage(url: string) {
  if (url === currentUrl) return;
  if (currentUrl) {
    if (!history.includes(currentUrl)) {
      history.unshift(currentUrl);
      if (history.length > 9) history.pop();
    }
  }
  currentUrl = url;
  listeners.forEach((l) => l());
}

export function getImageList(): { current: string | null; history: string[] } {
  return { current: currentUrl, history: [...history] };
}

export function subscribeImageHistory(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
