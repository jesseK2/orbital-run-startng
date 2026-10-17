const START_NG_ORIGIN = "https://start.ng";
let connectFrame;

function getConnectFrame() {
  if (!connectFrame) {
    connectFrame = new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");
      frame.src = `${START_NG_ORIGIN}/connect`;
      frame.title = "Start.ng player connection";
      frame.hidden = true;
      frame.onload = () => resolve(frame);
      frame.onerror = () => {
        connectFrame = undefined;
        reject(new Error("Could not load the Start.ng connection."));
      };
      document.body.append(frame);
    });
  }

  return connectFrame;
}

async function askStartNg(message, replyType, timeoutMs = 5000) {
  const frame = await getConnectFrame();

  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Start.ng did not respond. Please try again."));
    }, timeoutMs);

    function onMessage(event) {
      if (
        event.origin !== START_NG_ORIGIN ||
        event.source !== frame.contentWindow ||
        event.data?.type !== replyType ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(event.data);
    }

    window.addEventListener("message", onMessage);
    frame.contentWindow.postMessage({ ...message, requestId }, START_NG_ORIGIN);
  });
}

export async function getStartNgPlayer() {
  const reply = await askStartNg({ type: "startng:whoami" }, "startng:user");
  const player = reply?.user ?? reply?.guest;

  if (
    !player ||
    typeof player.name !== "string" ||
    !player.style ||
    typeof player.style !== "object"
  ) {
    throw new Error("Start.ng did not return a character.");
  }

  return {
    ...player,
    account: reply.user?.account ?? "",
    isGuest: !reply.user,
    face: typeof player.face === "string" ? player.face : "",
  };
}

export function watchStartNgPlayer(onPlayer, onError) {
  let active = true;
  let refreshPending = false;

  const refresh = async () => {
    if (!active || refreshPending) return;
    refreshPending = true;

    try {
      const player = await getStartNgPlayer();
      if (active) onPlayer(player);
    } catch (error) {
      if (active) onError(error);
    } finally {
      refreshPending = false;
    }
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") void refresh();
  };

  void refresh();
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    active = false;
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function startNgSignIn() {
  const returnTo = `${window.location.origin}${window.location.pathname}`;
  window.location.assign(
    `${START_NG_ORIGIN}/?return_to=${encodeURIComponent(returnTo)}`
  );
}

export function getPreviewPlayer() {
  return {
    id: "preview",
    name: "Nova Runner",
    account: "preview",
    isGuest: false,
    face: "",
    style: {
      body: "female",
      primaryColor: "#a55eea",
      secondaryColor: "#0c6e5a",
      skinColor: "#8d5524",
      hairColor: "#17120f",
      hair: "braids",
      hat: "crown",
      accessory: "earrings",
    },
  };
}
