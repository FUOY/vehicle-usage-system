// ===== バージョン確認 =====
console.log('🚗 JavaScript VERSION: 9.4 - GitHub Pages + AllOrigins Proxy版');
console.log('ファイル読み込み時刻:', new Date().toISOString());

// ⚙️ Google Sheets Web API URL（AllOriginsプロキシ経由）
const GOOGLE_SHEETS_API_URL = 'https://api.allorigins.win/raw?url=https://script.google.com/macros/s/AKfycby7OrRmnFOm_gzKQehYCmbBybFxIU2YSTm6Pk7CFtvfVG0Y6s3a0IwYyIrEOC-tWeQA/exec';

console.log('✅ Google Sheets API URL (AllOrigins Proxy経由):', GOOGLE_SHEETS_API_URL);
console.log('⚡ より安定したCORSプロキシを使用');

console.log('⚡ CORSプロキシが有効です');


// グローバル変数
let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
const recordsPerPage = 10;
let deleteTargetId = null;
let editTargetId = null;
let currentVehicle = '2405';
let receiptImageBase64 = '';
let editReceiptImageBase64 = '';

console.log('main.js 読み込み開始');

// ===== 画像圧縮処理 =====
async function compressImage(file) {
    console.log('画像圧縮開始:', file.name, file.size, 'bytes');
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 最大幅・高さを1200pxに制限
                let width = img.width;
                let height = img.height;
                const maxSize = 1200;
                
                if (width > height && width > maxSize) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // 品質を調整しながら500KB以下に圧縮
                let quality = 0.7;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                while (dataUrl.length > 500 * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                
                console.log('圧縮完了:', Math.round(dataUrl.length / 1024), 'KB');
                resolve(dataUrl);
            };
            
            img.onerror = function() {
                reject(new Error('画像の読み込みに失敗しました'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('ファイルの読み込みに失敗しました'));
        };
        
        reader.readAsDataURL(file);
    });
}

// ===== 初期化処理 =====
async function initializeApp() {
    console.log('アプリケーション初期化開始');
    
    // Google Apps Script URL チェック
    if (GOOGLE_SHEETS_API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        alert('⚠️ Google Apps Script URLが設定されていません。\n\nNETLIFY_DEPLOYMENT_GUIDE.mdを参照して設定してください。');
        console.error('Google Apps Script URLが未設定です');
        return;
    }
    
    // 今日の日付を設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('usage_date').value = today;
    
    // 現在の年月を設定
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('filter_month').value = currentMonth;
    
    // 車番タブの初期化
    initializeVehicleTabs();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // データ読み込み
    await loadData();
    
    console.log('アプリケーション初期化完了');
}

// ===== 車番タブの初期化 =====
function initializeVehicleTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 全てのタブから active クラスを削除
            tabs.forEach(t => t.classList.remove('active'));
            
            // クリックされたタブに active クラスを追加
            this.classList.add('active');
            
            // 車番を取得して設定
            currentVehicle = this.dataset.vehicle;
            
            // 車番フィールドに反映
            document.getElementById('vehicle_number').value = currentVehicle;
            
            console.log('車番選択:', currentVehicle);
            
            // 最新走行距離を更新
            updateLastMileage();
        });
    });
    
    // 初期車番を設定
    document.getElementById('vehicle_number').value = currentVehicle;
    updateLastMileage();
}

// ===== 最新走行距離の更新 =====
function updateLastMileage() {
    const selectedVehicle = currentVehicle;
    
    // 該当車番のレコードをフィルタリング
    const vehicleRecords = allRecords.filter(r => r.vehicle_number === selectedVehicle);
    
    if (vehicleRecords.length === 0) {
        const lastMileageHint = document.getElementById('lastMileageHint');
    if (lastMileageHint) {
        lastMileageHint.textContent = '前回: データなし';
    }
        return;
    }
    
    // 日付でソートして最新のレコードを取得
    vehicleRecords.sort((a, b) => {
        const dateA = new Date(a.usage_date + ' ' + (a.arrival_time || a.departure_time || '00:00'));
        const dateB = new Date(b.usage_date + ' ' + (b.arrival_time || b.departure_time || '00:00'));
        return dateB - dateA;
    });
    
    const latestRecord = vehicleRecords[0];
    const latestMileage = latestRecord.arrival_mileage || latestRecord.departure_mileage || 0;
    
    const lastMileageHint = document.getElementById('lastMileageHint');
    if (lastMileageHint) {
        lastMileageHint.textContent = `前回: ${latestMileage.toLocaleString()} km`;
    }
    console.log('最新走行距離:', latestMileage, 'km');
}

// ===== イベントリスナーの設定 =====
function setupEventListeners() {
    console.log('イベントリスナー設定開始');
    
    // 登録フォーム送信
    const form = document.getElementById('usageForm');
    if (form) {
        // submit イベント
        form.addEventListener('submit', handleFormSubmit);
        // フォールバック用
        form.onsubmit = handleFormSubmit;
        console.log('✅ 登録フォームのイベント設定完了');
    }
    
    // クリアボタン
    const clearBtn = document.getElementById('clearFormBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleFormReset);
        clearBtn.addEventListener('touchend', handleFormReset);
    }
    
    // 登録ボタン（フォールバック）
    const submitBtn = document.querySelector('#usageForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
    
    // レシート画像アップロード（登録フォーム）
    const receiptInput = document.getElementById('receipt_image');
    if (receiptInput) {
        receiptInput.addEventListener('change', (e) => handleReceiptUpload(e, false));
    }
    
    // 編集フォーム送信
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
    
    // レシート画像アップロード（編集フォーム）
    const editReceiptInput = document.getElementById('edit_receipt_image');
    if (editReceiptInput) {
        editReceiptInput.addEventListener('change', (e) => handleReceiptUpload(e, true));
    }
    
    // モーダルを閉じる
    const closeEditBtn = document.getElementById('closeEdit');
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', closeEditModal);
    }
    
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    
    const closeReceiptBtn = document.getElementById('closeReceipt');
    if (closeReceiptBtn) {
        closeReceiptBtn.addEventListener('click', closeReceiptModal);
    }
    
    // フィルター適用
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilter);
    }
    
    // フィルターリセット
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilter);
    }
    
    // Excel出力
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    // ページネーション
    const prevBtn = document.getElementById('prevPage');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }
    
    const nextBtn = document.getElementById('nextPage');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    // 削除確認
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // 削除キャンセル
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    // 車番フィールドの編集防止（キーボード・ペースト・マウス入力を無効化）
    const vehicleNumberInput = document.getElementById('vehicle_number');
    if (vehicleNumberInput) {
        vehicleNumberInput.addEventListener('keydown', (e) => e.preventDefault());
        vehicleNumberInput.addEventListener('paste', (e) => e.preventDefault());
        vehicleNumberInput.addEventListener('input', (e) => {
            e.target.value = currentVehicle;
        });
        vehicleNumberInput.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.target.blur();
        });
    }
    
    console.log('イベントリスナー設定完了');
}

// ===== レシート画像アップロード処理 =====
async function handleReceiptUpload(event, isEditMode) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('❌ 画像ファイルを選択してください', 'error');
        return;
    }
    
    showNotification('📸 画像を圧縮しています...', 'info');
    
    try {
        const compressedDataUrl = await compressImage(file);
        const sizeKB = Math.round(compressedDataUrl.length / 1024);
        
        if (isEditMode) {
            editReceiptImageBase64 = compressedDataUrl;
            const preview = document.getElementById('edit_receipt_preview');
            if (preview) {
                preview.innerHTML = `<img src="${compressedDataUrl}" alt="レシート"><p>サイズ: ${sizeKB} KB</p>`;
            }
        } else {
            receiptImageBase64 = compressedDataUrl;
            const preview = document.getElementById('receiptPreview');
            if (preview) {
                preview.innerHTML = `<img src="${compressedDataUrl}" alt="レシート"><p>サイズ: ${sizeKB} KB</p>`;
            }
        }
        
        showNotification(`✅ 画像を圧縮しました (${sizeKB} KB)`, 'success');
        
    } catch (error) {
        console.error('画像圧縮エラー:', error);
        showNotification('❌ 画像の圧縮に失敗しました', 'error');
    }
}

// ===== フォームリセット =====
function handleFormReset(e) {
    if (e) e.preventDefault();
    
    const form = document.getElementById('usageForm');
    if (form) {
        form.reset();
    }
    
    // 車番を現在選択中の値に戻す
    document.getElementById('vehicle_number').value = currentVehicle;
    
    // 今日の日付を再設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('usage_date').value = today;
    
    // レシート画像をクリア
    receiptImageBase64 = '';
    const preview = document.getElementById('receiptPreview');
    if (preview) {
        preview.innerHTML = '';
    }
    
    console.log('フォームをリセットしました');
}

// ===== フォーム送信処理 =====
async function handleFormSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('===== フォーム送信開始 =====');
    console.log('車番:', document.getElementById('vehicle_number').value);
    
    // バリデーション
    const vehicleNumber = document.getElementById('vehicle_number').value;
    const staffName = document.getElementById('staff_name').value;
    const usageDate = document.getElementById('usage_date').value;
    const departureTime = document.getElementById('departure_time').value;
    const departureMileage = parseFloat(document.getElementById('departure_mileage').value);
    const destination = document.getElementById('destination').value;
    
    if (!vehicleNumber || !staffName || !usageDate || !departureTime || !departureMileage || !destination) {
        alert('❌ 必須項目を全て入力してください\n\n車番: ' + (vehicleNumber || '未入力') + '\n担当者: ' + (staffName || '未入力') + '\n使用日: ' + (usageDate || '未入力') + '\n出発時刻: ' + (departureTime || '未入力') + '\n出発時走行距離: ' + (departureMileage || '未入力') + '\n目的地: ' + (destination || '未入力'));
        return false;
    }
    
    // 帰着情報のバリデーション
    const arrivalTime = document.getElementById('arrival_time').value;
    const arrivalMileage = document.getElementById('arrival_mileage').value;
    
    if ((arrivalTime && !arrivalMileage) || (!arrivalTime && arrivalMileage)) {
        showNotification('⚠️ 帰着時刻と帰着時走行距離は両方入力するか、両方空欄にしてください', 'warning');
        return false;
    }
    
    if (arrivalMileage && parseFloat(arrivalMileage) <= departureMileage) {
        showNotification('⚠️ 帰着時走行距離は出発時走行距離より大きい値を入力してください', 'warning');
        return false;
    }
    
    // データ準備
    const formData = {
        usage_date: usageDate,
        vehicle_number: vehicleNumber,
        staff_name: staffName,
        departure_time: departureTime,
        departure_mileage: departureMileage,
        destination: destination,
        arrival_time: arrivalTime || '',
        arrival_mileage: arrivalMileage ? parseFloat(arrivalMileage) : 0,
        fuel_amount: parseFloat(document.getElementById('fuel_amount').value) || 0,
        receipt_image: receiptImageBase64 || ''
    };
    
    console.log('送信データ:', formData);
    
    showNotification('📤 登録中...', 'info');
    
    try {
        console.log('Google Sheets API呼び出し開始');
        
        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('APIレスポンス:', result);
        
        if (result.success) {
            showNotification('✅ 登録が完了しました', 'success');
            handleFormReset();
            await loadData();
            updateLastMileage();
        } else {
            throw new Error(result.error || '登録に失敗しました');
        }
        
    } catch (error) {
        console.error('登録エラー:', error);
        showNotification('❌ 登録に失敗しました', 'error');
    }
    
    return false;
}

// ===== 編集モーダルを開く =====
function openEditModal(id) {
    const record = allRecords.find(r => r.id === id);
    
    if (!record) {
        console.error('レコードが見つかりません:', id);
        return;
    }
    
    console.log('編集モーダルを開く:', record);
    editTargetId = id;
    
    // 既存データを表示（読み取り専用）
    document.getElementById('edit_display_date').textContent = record.usage_date || '';
    document.getElementById('edit_display_vehicle').textContent = record.vehicle_number || '';
    document.getElementById('edit_display_staff').textContent = record.staff_name || '';
    document.getElementById('edit_display_departure_time').textContent = record.departure_time || '';
    document.getElementById('edit_display_departure_mileage').textContent = record.departure_mileage ? record.departure_mileage.toLocaleString() : '';
    document.getElementById('edit_display_destination').textContent = record.destination || '';
    
    // 編集可能フィールドに現在値を設定
    document.getElementById('edit_arrival_time').value = record.arrival_time || '';
    document.getElementById('edit_arrival_mileage').value = record.arrival_mileage || '';
    document.getElementById('edit_fuel_amount').value = record.fuel_amount || 0;
    
    // レシート画像のプレビュー
    editReceiptImageBase64 = record.receipt_image || '';
    const preview = document.getElementById('editReceiptPreview');
    if (preview) {
        if (record.receipt_image) {
            const sizeKB = Math.round(record.receipt_image.length / 1024);
            preview.innerHTML = `<img src="${record.receipt_image}" alt="レシート"><p>サイズ: ${sizeKB} KB</p>`;
        } else {
            preview.innerHTML = '<p style="color: #999;">レシート画像なし</p>';
        }
    }
    
    // モーダルを表示
    document.getElementById('editModal').style.display = 'flex';
}

// ===== 編集フォーム送信処理 =====
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const arrivalTime = document.getElementById('edit_arrival_time').value;
    const arrivalMileage = parseFloat(document.getElementById('edit_arrival_mileage').value);
    const fuelAmount = parseFloat(document.getElementById('edit_fuel_amount').value) || 0;
    
    // バリデーション
    const record = allRecords.find(r => r.id === editTargetId);
    if (arrivalMileage && arrivalMileage <= record.departure_mileage) {
        showNotification('⚠️ 帰着時走行距離は出発時走行距離より大きい値を入力してください', 'warning');
        return;
    }
    
    // 更新データ
    const updateData = {
        arrival_time: arrivalTime || '',
        arrival_mileage: arrivalMileage || 0,
        fuel_amount: fuelAmount,
        receipt_image: editReceiptImageBase64 || ''
    };
    
    console.log('更新データ:', updateData);
    
    showNotification('📤 更新中...', 'info');
    
    try {
        console.log('Google Sheets API更新開始:', editTargetId);
        
        const url = `${GOOGLE_SHEETS_API_URL}?id=${editTargetId}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('更新レスポンス:', result);
        
        if (result.success) {
            showNotification('✅ 更新が完了しました', 'success');
            closeEditModal();
            await loadData();
            updateLastMileage();
        } else {
            throw new Error(result.error || '更新に失敗しました');
        }
        
    } catch (error) {
        console.error('更新エラー:', error);
        showNotification('❌ 更新に失敗しました', 'error');
    }
}

// ===== 編集モーダルを閉じる =====
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editTargetId = null;
    editReceiptImageBase64 = '';
    
    const form = document.getElementById('editForm');
    if (form) form.reset();
    
    const preview = document.getElementById('editReceiptPreview');
    if (preview) preview.innerHTML = '';
}

// ===== データ読み込み =====
async function loadData() {
    console.log('データ読み込み開始');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: 'GET'
        });
        
        console.log('APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('取得データ:', result);
        
        if (result.success) {
            allRecords = result.data || [];
            console.log('データ件数:', allRecords.length);
            applyFilter();
            updateLastMileage();
        } else {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
    } catch (error) {
        console.error('データ取得エラー:', error);
        showNotification('❌ データの取得に失敗しました', 'error');
    }
}

// ===== フィルター適用 =====
function applyFilter() {
    const filterMonth = document.getElementById('filter_month').value;
    const filterVehicle = document.getElementById('filter_vehicle').value;
    const filterStaff = document.getElementById('filter_staff').value;
    
    console.log('フィルター条件:', {filterMonth, filterVehicle, filterStaff});
    console.log('allRecords件数:', allRecords.length);
    
    filteredRecords = allRecords.filter(record => {
        let match = true;
        
        if (filterMonth && record.usage_date && !record.usage_date.startsWith(filterMonth)) {
            match = false;
        }
        
        if (filterVehicle && record.vehicle_number !== filterVehicle) {
            match = false;
        }
        
        if (filterStaff && record.staff_name !== filterStaff) {
            match = false;
        }
        
        return match;
    });
    
    console.log('フィルター後件数:', filteredRecords.length);
    
    currentPage = 1;
    renderTable();
}

// ===== フィルターリセット =====
function resetFilter() {
    document.getElementById('filter_month').value = new Date().toISOString().slice(0, 7);
    document.getElementById('filter_vehicle').value = '';
    document.getElementById('filter_staff').value = '';
    
    applyFilter();
}

// ===== テーブル描画 =====
function renderTable() {
    console.log('テーブル描画開始');
    const tbody = document.getElementById('usageTableBody');
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageRecords = filteredRecords.slice(startIndex, endIndex);
    
    console.log('表示レコード数:', pageRecords.length);
    
    if (pageRecords.length === 0) {
        console.log('データなし - 空メッセージ表示');
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">データがありません</td></tr>';
    } else {
        console.log('データあり - テーブル描画');
        tbody.innerHTML = pageRecords.map(record => {
            const distance = (record.arrival_mileage && record.departure_mileage) 
                ? (record.arrival_mileage - record.departure_mileage).toFixed(1) 
                : '-';
            
            const isIncomplete = !record.arrival_time || !record.arrival_mileage;
            const rowStyle = isIncomplete ? 'background-color: #fff3cd;' : '';
            
            return `
                <tr style="${rowStyle}">
                    <td>${record.usage_date}</td>
                    <td>${record.vehicle_number}</td>
                    <td>${record.staff_name}</td>
                    <td>${record.departure_time}</td>
                    <td>${record.departure_mileage ? record.departure_mileage.toLocaleString() : '-'}</td>
                    <td>${record.destination}</td>
                    <td>${record.arrival_time || '未入力'}</td>
                    <td>${record.arrival_mileage ? record.arrival_mileage.toLocaleString() : '未入力'}</td>
                    <td>${distance}</td>
                    <td>${record.fuel_amount || 0}</td>
                    <td class="action-buttons">
                        ${record.receipt_image ? `<button class="btn-small" onclick="showReceipt(\\'${record.id}\\')">📷 レシート</button>` : ''}
                        <button class="btn-small edit-btn" onclick="openEditModal(\\'${record.id}\\')">✏️ 編集</button>
                        <button class="btn-small btn-danger" onclick="openDeleteModal(\\'${record.id}\\')">🗑️ 削除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // ページネーション更新
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
    }
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// ===== レシート表示 =====
function showReceipt(id) {
    const record = allRecords.find(r => r.id === id);
    
    if (!record || !record.receipt_image) {
        showNotification('❌ レシート画像が見つかりません', 'error');
        return;
    }
    
    document.getElementById('receiptImage').src = record.receipt_image;
    document.getElementById('receiptModal').style.display = 'flex';
}

// ===== レシートモーダルを閉じる =====
function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
}

// ===== 削除モーダルを開く =====
function openDeleteModal(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

// ===== 削除モーダルを閉じる =====
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
}

// ===== 削除実行 =====
async function confirmDelete() {
    if (!deleteTargetId) return;
    
    showNotification('🗑️ 削除中...', 'info');
    
    try {
        console.log('Google Sheets API削除開始:', deleteTargetId);
        
        const url = `${GOOGLE_SHEETS_API_URL}?id=${deleteTargetId}`;
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        console.log('APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('削除レスポンス:', result);
        
        if (result.success) {
            showNotification('✅ 削除が完了しました', 'success');
            closeDeleteModal();
            await loadData();
            updateLastMileage();
        } else {
            throw new Error(result.error || '削除に失敗しました');
        }
        
    } catch (error) {
        console.error('削除エラー:', error);
        showNotification('❌ 削除に失敗しました', 'error');
    }
}

// ===== Excel出力 =====
function exportToExcel() {
    if (filteredRecords.length === 0) {
        showNotification('❌ 出力するデータがありません', 'warning');
        return;
    }
    
    showNotification('📥 Excel出力中...', 'info');
    
    try {
        // ヘッダー行
        const headers = [
            '使用日', '車番', '担当者', '出発時刻', '出発時走行距離', 
            '目的地', '帰着時刻', '帰着時走行距離', '走行距離', '給油量'
        ];
        
        // データ行
        const rows = filteredRecords.map(record => {
            const distance = (record.arrival_mileage && record.departure_mileage) 
                ? (record.arrival_mileage - record.departure_mileage).toFixed(1) 
                : '';
            
            return [
                record.usage_date,
                record.vehicle_number,
                record.staff_name,
                record.departure_time,
                record.departure_mileage || '',
                record.destination,
                record.arrival_time || '',
                record.arrival_mileage || '',
                distance,
                record.fuel_amount || ''
            ];
        });
        
        // SheetJSを使用してExcel出力
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '利用履歴');
        
        const filterMonth = document.getElementById('filter_month').value || '全期間';
        const fileName = `社用車利用履歴_${filterMonth}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        showNotification('✅ Excel出力が完了しました', 'success');
        
    } catch (error) {
        console.error('Excel出力エラー:', error);
        showNotification('❌ Excel出力に失敗しました', 'error');
    }
}

// ===== 通知表示 =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ===== ページ読み込み時に初期化 =====
document.addEventListener('DOMContentLoaded', initializeApp);
