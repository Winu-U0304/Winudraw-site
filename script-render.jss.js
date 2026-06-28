// --- 1. 背景（写真または白背景）を描画する処理 ---
function drawBackgroundLayer(targetCtx) {
    if (bgImage) {
        const ratio = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const x = (canvas.width - bgImage.width * ratio) / 2;
        const y = (canvas.height - bgImage.height * ratio) / 2;
        targetCtx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height, x, y, bgImage.width * ratio, bgImage.height * ratio);
    } else if (canvas.dataset.useWhiteBg === "true") {
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// --- 2. 各パーツの「外枠の四角い形（範囲）」を計算する処理 ---
function getObjectBounds(obj) {
    if (obj.type === "rect") {
        return {
            minX: obj.w < 0 ? obj.x + obj.w : obj.x,
            maxX: obj.w < 0 ? obj.x : obj.x + obj.w,
            minY: obj.h < 0 ? obj.y + obj.h : obj.y,
            maxY: obj.h < 0 ? obj.y : obj.y + obj.h
        };
    }
    if (obj.type === "text") {
        ctx.font = `${obj.lineWidth * 4}px sans-serif`;
        const textWidth = ctx.measureText(obj.text).width;
        const textHeight = obj.lineWidth * 4;
        return { minX: obj.x, maxX: obj.x + textWidth, minY: obj.y - textHeight, maxY: obj.y };
    }
    if (obj.type === "draw" || obj.type === "eraser") {
        const xs = obj.points.map(p => p.x);
        const ys = obj.points.map(p => p.y);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
}

// --- 3. 画面全体を再描画（リフレッシュ）するメイン処理 ---
function refreshCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.useWhiteBg = "false";
    drawBackgroundLayer(ctx);

    // すべての落書きパーツを順番に描く
    objects.forEach(obj => {
        ctx.save();
        ctx.strokeStyle = obj.color;
        ctx.fillStyle = obj.color;
        ctx.lineWidth = obj.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (obj.type === "eraser") {
            // 消しゴムパーツは通過した部分の描画を透明にくり抜く
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        }

        if (obj.type === "draw" || obj.type === "eraser") {
            ctx.beginPath();
            obj.points.forEach((p, index) => {
                if (index === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        } else if (obj.type === "rect") {
            ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        } else if (obj.type === "text") {
            ctx.font = `${obj.lineWidth * 4}px sans-serif`;
            ctx.fillText(obj.text, obj.x, obj.y);
        }
        ctx.restore();
    });

    // パーツが選択されている場合は青い枠線と変形用の小さな四角を描く
    if (selectedObj) {
        ctx.save();
        ctx.strokeStyle = "#007bff";
        ctx.lineWidth = 1.5;
        const bounds = getObjectBounds(selectedObj);
        
        ctx.setLineDash([4, 4]); // 点線枠
        ctx.strokeRect(bounds.minX - 4, bounds.minY - 4, (bounds.maxX - bounds.minX) + 8, (bounds.maxY - bounds.minY) + 8);
        
        ctx.setLineDash([]); // 実線に戻して右下の変形用ハンドルを描く
        ctx.fillStyle = "#007bff";
        ctx.fillRect(bounds.maxX + 2, bounds.maxY + 2, 8, 8);
        ctx.restore();
    }
}
