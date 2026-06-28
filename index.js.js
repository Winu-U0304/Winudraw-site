// --- 1. モード切り替え & 座標計算 ---
function setToolMode(modeName) {
    Object.keys(tools).forEach(t => tools[t].classList.remove("active"));
    tools[modeName].classList.add("active");
    currentMode = modeName;
    selectedObj = null;
    refreshCanvas();
}
Object.keys(tools).forEach(m => tools[m].addEventListener("click", () => setToolMode(m)));
lineWidth.addEventListener("input", () => widthNum.textContent = lineWidth.value);

function getCanvasCoordinates(e) {
    const r = canvas.getBoundingClientRect();
    const clX = e.touches ? e.touches.clientX : e.clientX;
    const clY = e.touches ? e.touches.clientY : e.clientY;
    return { x: (clX - r.left) * (canvas.width / r.width), y: (clY - r.top) * (canvas.height / r.height) };
}

// --- 2. 拡大縮小（変形）処理 ---
function resizeSelectedObject(obj, deltaX, deltaY) {
    const b = getObjectBounds(obj);
    const scaleX = ((b.maxX - b.minX) + deltaX) / ((b.maxX - b.minX) || 1);
    const scaleY = ((b.maxY - b.minY) + deltaY) / ((b.maxY - b.minY) || 1);
    if (obj.type === "rect") { obj.w *= scaleX; obj.h *= scaleY; }
    else if (obj.type === "text") { obj.lineWidth = Math.max(1, obj.lineWidth * ((scaleX + scaleY) / 2)); }
    else if (obj.type === "draw" || obj.type === "eraser") {
        obj.points.forEach(p => { p.x = b.minX + (p.x - b.minX) * scaleX; p.y = b.minY + (p.y - b.minY) * scaleY; });
    }
}

// --- 3. マウス・タッチイベントの登録 ---
canvas.addEventListener("mousedown", onStart); canvas.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onEnd);
canvas.addEventListener("touchstart", onStart); canvas.addEventListener("touchmove", onMove); window.addEventListener("touchend", onEnd);

function onStart(e) {
    const c = getCanvasCoordinates(e);
    if (currentMode === "select") {
        if (selectedObj) {
            const b = getObjectBounds(selectedObj);
            if (c.x >= b.maxX && c.x <= b.maxX + 15 && c.y >= b.maxY && c.y <= b.maxY + 15) {
                isDrawing = true; isResizing = true; dragStart = c; return;
            }
        }
        selectedObj = null; isResizing = false;
        for (let i = objects.length - 1; i >= 0; i--) {
            const b = getObjectBounds(objects[i]);
            if (c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY && objects[i].type !== "eraser") {
                selectedObj = objects[i]; isDrawing = true; dragStart = c; break;
            }
        }
        refreshCanvas();
    } else if (currentMode === "draw" || currentMode === "eraser") {
        isDrawing = true; activePath = { type: currentMode, color: colorPicker.value, lineWidth: parseInt(lineWidth.value), points: [c] };
        objects.push(activePath);
    } else if (currentMode === "rect") {
        isDrawing = true; activeRect = { type: "rect", color: colorPicker.value, lineWidth: parseInt(lineWidth.value), x: c.x, y: c.y, w: 0, h: 0 };
        objects.push(activeRect); dragStart = c;
    } else if (currentMode === "text") {
        setTimeout(() => {
            const txt = prompt("追加する文字を入力:");
            if (txt) { objects.push({ type: "text", color: colorPicker.value, lineWidth: parseInt(lineWidth.value), x: c.x, y: c.y, text: txt }); refreshCanvas(); }
        }, 10);
    }
}

function onMove(e) {
    if (!isDrawing) return; e.preventDefault(); const c = getCanvasCoordinates(e);
    if (currentMode === "select" && selectedObj) {
        const dX = c.x - dragStart.x, dY = c.y - dragStart.y; dragStart = c;
        if (isResizing) { resizeSelectedObject(selectedObj, dX, dY); }
        else if (selectedObj.type === "draw" || selectedObj.type === "eraser") { selectedObj.points.forEach(p => { p.x += dX; p.y += dY; }); }
        else { selectedObj.x += dX; selectedObj.y += dY; }
        refreshCanvas();
    } else if ((currentMode === "draw" || currentMode === "eraser") && activePath) { activePath.points.push(c); refreshCanvas(); }
    else if (currentMode === "rect" && activeRect) { activeRect.w = c.x - dragStart.x; activeRect.h = c.y - dragStart.y; refreshCanvas(); }
}
function onEnd() { isDrawing = false; activePath = null; activeRect = null; isResizing = false; }

// --- 4. 背景写真・削除・保存処理 ---
imageLoader.addEventListener("change", (e) => {
    const r = new FileReader();
    r.onload = (ev) => {
        const img = new Image();
        img.onload = () => { objects = []; selectedObj = null; bgImage = img; refreshCanvas(); };
        img.src = ev.target.result;
    };
    if (e.target.files && e.target.files[0]) r.readAsDataURL(e.target.files[0]);
});

btnDelete.addEventListener("click", () => { if (selectedObj) { objects = objects.filter(o => o !== selectedObj); selectedObj = null; refreshCanvas(); } });

function triggerDownload(uri, filename) {
    const l = document.createElement("a"); l.href = uri; l.download = filename;
    document.body.appendChild(l); l.click(); document.body.removeChild(l);
}

btnSaveWhite.addEventListener("click", () => {
    selectedObj = null; refreshCanvas();
    const temp = document.createElement("canvas"); temp.width = canvas.width; temp.height = canvas.height;
    temp.dataset.useWhiteBg = "true"; const tempCtx = temp.getContext("2d");
    drawBackgroundLayer(tempCtx); tempCtx.drawImage(canvas, 0, 0);
    triggerDownload(temp.toDataURL("image/png"), "artwork-bg.png");
});

btnSaveTrans.addEventListener("click", () => { selectedObj = null; refreshCanvas(); triggerDownload(canvas.toDataURL("image/png"), "artwork-trans.png"); });

btnClear.addEventListener("click", () => { if (confirm("全部消しますか？")) { bgImage = null; objects = []; selectedObj = null; refreshCanvas(); } });
