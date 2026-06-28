// --- 1. 画面の要素（HTMLパーツ）を取得 ---
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("color");
const lineWidth = document.getElementById("width");
const widthNum = document.getElementById("widthNum");
const imageLoader = document.getElementById("load");
const btnSaveWhite = document.getElementById("saveW");
const btnSaveTrans = document.getElementById("saveT");
const btnClear = document.getElementById("clearBtn");
const btnDelete = document.getElementById("delBtn");

// ツールボタンのグループ
const tools = {
    select: document.getElementById("tSelect"),
    draw: document.getElementById("tDraw"),
    eraser: document.getElementById("tEraser"),
    rect: document.getElementById("tRect"),
    text: document.getElementById("tText")
};

// --- 2. アプリの状態を管理する変数 ---
let currentMode = "select";     // 現在選ばれているモード
let isDrawing = false;          // マウスや指で押している真っ最中か
let bgImage = null;             // 読み込んだ背景写真のデータ
let objects = [];               // 画面上に描かれた全てのパーツ（線、四角、文字など）を記憶する配列
let selectedObj = null;         // 現在クリックされて選択されているパーツ
let dragStart = { x: 0, y: 0 }; // ドラッグ移動や変形を始めたときの最初の座標
let activeRect = null;          // 今まさに引っ張って描いている途中の四角形
let activePath = null;          // 今まさに描いている途中の手書きの線、または消しゴムの軌跡
let isResizing = false;         // 選択枠の右下をつかんで「変形（拡大縮小）」させている最中か
