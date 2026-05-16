import * as THREE from 'three';

// Toutes les textures sont équirectangulaires 2:1. La bande noire centrale
// correspond à l'équateur de la sphère, le cercle blanc au bouton de fermeture.
// Seul le motif de la calotte supérieure varie d'un type à l'autre.

const W = 1024;
const H = 512;
const EQ = H / 2;

const BAND_THICKNESS = 30;
const BUTTON_R = 42;
const BUTTON_RING = 10;
const BLACK = '#0a0a0a';
const OFF_WHITE = '#f3f1ec';

function fillBody(ctx, topColor, bottomColor = OFF_WHITE) {
    ctx.fillStyle = topColor;
    ctx.fillRect(0, 0, W, EQ);
    ctx.fillStyle = bottomColor;
    ctx.fillRect(0, EQ, W, H - EQ);
}

function drawBand(ctx, color = BLACK) {
    ctx.fillStyle = color;
    ctx.fillRect(0, EQ - BAND_THICKNESS / 2, W, BAND_THICKNESS);
}

function drawButton(ctx, ringColor = BLACK, fillColor = OFF_WHITE) {
    ctx.fillStyle = ringColor;
    ctx.beginPath();
    ctx.arc(W / 2, EQ, BUTTON_R + BUTTON_RING, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(W / 2, EQ, BUTTON_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, EQ, BUTTON_R - 14, 0, Math.PI * 2);
    ctx.stroke();
}

// ---- 11 recettes ----

function paintPokeball(ctx) {
    fillBody(ctx, '#dc0a2d');
    drawBand(ctx);
    drawButton(ctx);
}

function paintSuperball(ctx) {
    fillBody(ctx, '#2f7fc5');
    ctx.strokeStyle = '#c01a1a';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drawV = (cx) => {
        const w = 110;
        ctx.beginPath();
        ctx.moveTo(cx - w, EQ * 0.55);
        ctx.lineTo(cx, EQ * 0.88);
        ctx.lineTo(cx + w, EQ * 0.55);
        ctx.stroke();
    };
    drawV(W * 0.25);
    drawV(W * 0.75);
    drawBand(ctx);
    drawButton(ctx);
}

function paintHyperball(ctx) {
    fillBody(ctx, '#171717');
    // H jaune épais centré au-dessus du bouton
    ctx.fillStyle = '#f4ce15';
    const cx = W / 2;
    const cy = EQ * 0.55;
    const hH = EQ * 0.65;
    const hW = 200;
    const t = 36;
    ctx.fillRect(cx - hW / 2, cy - hH / 2, t, hH);
    ctx.fillRect(cx + hW / 2 - t, cy - hH / 2, t, hH);
    ctx.fillRect(cx - hW / 2 + t, cy - t / 2, hW - 2 * t, t);
    drawBand(ctx);
    drawButton(ctx);
}

function paintRapideball(ctx) {
    fillBody(ctx, '#1448a8');
    // éclair stylisé au centre
    ctx.fillStyle = '#f4d627';
    const cx = W / 2;
    ctx.beginPath();
    ctx.moveTo(cx + 30, EQ * 0.18);
    ctx.lineTo(cx - 36, EQ * 0.58);
    ctx.lineTo(cx - 4, EQ * 0.60);
    ctx.lineTo(cx - 34, EQ * 0.92);
    ctx.lineTo(cx + 38, EQ * 0.50);
    ctx.lineTo(cx + 6, EQ * 0.48);
    ctx.closePath();
    ctx.fill();
    // 2 lignes jaunes obliques sur les côtés
    ctx.strokeStyle = '#f4d627';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    [W * 0.20, W * 0.80].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x - 80, EQ * 0.40);
        ctx.lineTo(x + 80, EQ * 0.80);
        ctx.stroke();
    });
    drawBand(ctx);
    drawButton(ctx);
}

function paintSafariball(ctx) {
    fillBody(ctx, '#3f7c2f');
    ctx.fillStyle = '#2a5320';
    const spots = [
        [W * 0.14, EQ * 0.28, 44, 22],
        [W * 0.32, EQ * 0.62, 52, 26],
        [W * 0.50, EQ * 0.32, 38, 18],
        [W * 0.68, EQ * 0.62, 52, 26],
        [W * 0.86, EQ * 0.28, 44, 22],
        [W * 0.22, EQ * 0.88, 40, 18],
        [W * 0.50, EQ * 0.80, 46, 20],
        [W * 0.78, EQ * 0.88, 40, 18],
    ];
    for (const [x, y, rx, ry] of spots) {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    drawBand(ctx);
    drawButton(ctx);
}

function paintSoinball(ctx) {
    fillBody(ctx, '#f5b6cb');
    // croix blanche au-dessus du bouton (motif "soin")
    ctx.fillStyle = '#ffffff';
    const cx = W / 2;
    const cy = EQ * 0.50;
    const arm = 70;
    const t = 18;
    ctx.fillRect(cx - arm / 2, cy - t / 2, arm, t);
    ctx.fillRect(cx - t / 2, cy - arm / 2, t, arm);
    // pastilles blanches de chaque côté
    [W * 0.18, W * 0.82].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, EQ * 0.55, 28, 0, Math.PI * 2);
        ctx.fill();
    });
    drawBand(ctx);
    drawButton(ctx);
}

function paintHonorball(ctx) {
    fillBody(ctx, '#f5e9d4');
    // liserés or autour de la bande
    ctx.fillStyle = '#c89c2a';
    ctx.fillRect(0, EQ - BAND_THICKNESS / 2 - 14, W, 5);
    ctx.fillRect(0, EQ + BAND_THICKNESS / 2 + 9, W, 5);
    // ruban or décoratif sur les côtés
    [W * 0.20, W * 0.80].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x - 60, EQ * 0.55);
        ctx.lineTo(x, EQ * 0.85);
        ctx.lineTo(x + 60, EQ * 0.55);
        ctx.strokeStyle = '#c89c2a';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    });
    drawBand(ctx);
    drawButton(ctx, '#c89c2a', '#fff8dc');
}

function paintLuxeball(ctx) {
    fillBody(ctx, '#161616', '#161616');
    // bande or large à la place de la bande noire
    ctx.fillStyle = '#d4a932';
    ctx.fillRect(0, EQ - BAND_THICKNESS / 2 - 10, W, BAND_THICKNESS + 20);
    // liserés rouge fins au-dessus et en-dessous
    ctx.fillStyle = '#dc1818';
    ctx.fillRect(0, EQ - BAND_THICKNESS * 2, W, 4);
    ctx.fillRect(0, EQ + BAND_THICKNESS * 2 - 4, W, 4);
    drawBand(ctx);
    drawButton(ctx, '#d4a932', '#fff5d4');
}

function paintSombreball(ctx) {
    fillBody(ctx, '#3a1a4a', '#1f0f29');
    // accents violet profond
    ctx.fillStyle = '#2a0e3a';
    [
        [W * 0.20, EQ * 0.32, 90, 42],
        [W * 0.50, EQ * 0.60, 100, 46],
        [W * 0.80, EQ * 0.32, 90, 42],
    ].forEach(([x, y, rx, ry]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    // liseré rose autour de l'équateur
    ctx.fillStyle = '#d33a8a';
    ctx.fillRect(0, EQ - BAND_THICKNESS / 2 - 8, W, 3);
    ctx.fillRect(0, EQ + BAND_THICKNESS / 2 + 5, W, 3);
    drawBand(ctx);
    drawButton(ctx, '#d33a8a', '#ffd9ec');
}

function paintEtrangeball(ctx) {
    fillBody(ctx, '#2db28d');
    // 2 stripes turquoise sombre
    ctx.fillStyle = '#198868';
    ctx.fillRect(0, EQ - BAND_THICKNESS * 1.6, W, 18);
    ctx.fillRect(0, EQ + BAND_THICKNESS * 1.6 - 18, W, 18);
    // 4 petits losanges décoratifs
    ctx.fillStyle = '#7adcc4';
    [W * 0.15, W * 0.40, W * 0.60, W * 0.85].forEach((x) => {
        ctx.save();
        ctx.translate(x, EQ * 0.45);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-12, -12, 24, 24);
        ctx.restore();
    });
    drawBand(ctx);
    drawButton(ctx);
}

function paintMasterball(ctx) {
    fillBody(ctx, '#7a3df0');
    // ovales roses de chaque côté
    ctx.fillStyle = '#d33a8a';
    [W * 0.22, W * 0.78].forEach((x) => {
        ctx.beginPath();
        ctx.ellipse(x, EQ * 0.45, 62, 36, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    // grand M blanc centré
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const cx = W / 2;
    const cy = EQ * 0.52;
    const mH = 110;
    const mW = 140;
    ctx.beginPath();
    ctx.moveTo(cx - mW / 2, cy + mH / 2);
    ctx.lineTo(cx - mW / 2 + 6, cy - mH / 2);
    ctx.lineTo(cx, cy + mH / 4);
    ctx.lineTo(cx + mW / 2 - 6, cy - mH / 2);
    ctx.lineTo(cx + mW / 2, cy + mH / 2);
    ctx.stroke();
    drawBand(ctx);
    drawButton(ctx);
}

// ---- factory ----

function makeAssets(paintFn) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    paintFn(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    let _dataURL = null;
    return {
        texture,
        get dataURL() {
            if (_dataURL === null) _dataURL = canvas.toDataURL('image/png');
            return _dataURL;
        },
    };
}

export const ballAssets = {
    pokeball: makeAssets(paintPokeball),
    superball: makeAssets(paintSuperball),
    hyperball: makeAssets(paintHyperball),
    rapideball: makeAssets(paintRapideball),
    safariball: makeAssets(paintSafariball),
    soinball: makeAssets(paintSoinball),
    honorball: makeAssets(paintHonorball),
    luxeball: makeAssets(paintLuxeball),
    sombreball: makeAssets(paintSombreball),
    etrangeball: makeAssets(paintEtrangeball),
    masterball: makeAssets(paintMasterball),
};
