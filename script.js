const input = document.querySelector("#mediaUrl");
const checkBtn = document.querySelector("#checkBtn");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const downloadBtn = document.querySelector("#downloadBtn");
document.querySelector("#year").textContent = new Date().getFullYear();

function humanSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
}
function safeFileName(url, type) {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    return name || (type?.split("/")[1] ? `media.${type.split("/")[1]}` : "media-file");
  } catch { return "media-file"; }
}
function showError(text) {
  message.textContent = text;
  message.className = "message";
  result.classList.add("hidden");
}
checkBtn.addEventListener("click", async () => {
  message.textContent = "";
  message.className = "message";
  result.classList.add("hidden");
  let url;
  try { url = new URL(input.value.trim()); }
  catch { showError("Please paste a valid URL."); return; }
  if (!["https:", "http:"].includes(url.protocol)) { showError("Only HTTP and HTTPS links are supported."); return; }
  if (["youtube.com","www.youtube.com","m.youtube.com","youtu.be","instagram.com","www.instagram.com","facebook.com","www.facebook.com"].includes(url.hostname.toLowerCase())) {
    showError("This is a platform page, not a direct media file. Use that platform’s official download/export options or a permitted provider integration.");
    return;
  }
  checkBtn.disabled = true;
  checkBtn.textContent = "Checking…";
  try {
    // Metadata endpoint is optional. If backend isn't deployed, offer direct-link handling.
    const apiBase = window.MRS_API_BASE || "";
    if (apiBase) {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/metadata?url=${encodeURIComponent(url.href)}`);
      if (!response.ok) throw new Error("The source could not be checked. It may block metadata requests.");
      const data = await response.json();
      renderResult(url.href, data.contentType, data.size, data.fileName);
    } else {
      renderResult(url.href, "", null, safeFileName(url.href, ""));
      message.textContent = "Link format accepted. File details may be unavailable until the backend is connected.";
      message.className = "message ok";
    }
  } catch (err) {
    showError(err.message || "Could not inspect this link. Try a direct media file URL.");
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = "Check link";
  }
});
function renderResult(url, type, size, name) {
  document.querySelector("#fileName").textContent = name || safeFileName(url, type);
  document.querySelector("#fileType").textContent = type || "Direct link · details not provided";
  document.querySelector("#fileSize").textContent = humanSize(size);
  document.querySelector("#fileFormat").textContent = type?.split("/")[1]?.toUpperCase() || (name.includes(".") ? name.split(".").pop().toUpperCase() : "Unknown");
  document.querySelector("#fileQuality").textContent = "Source provided";
  downloadBtn.href = url;
  downloadBtn.setAttribute("download", name || "");
  downloadBtn.target = "_blank";
  result.classList.remove("hidden");
  if (!message.textContent) {
    message.textContent = "Link checked. Actual downloading depends on the source’s permissions and browser support.";
    message.className = "message ok";
  }
}
