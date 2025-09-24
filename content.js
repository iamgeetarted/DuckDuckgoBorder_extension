// Inject a small floating button and a settings popup into the page.
// Prevent multiple injections when navigating or re-injecting content scripts.
if (window.__ddgBorderInjected) {
	// already injected
} else {
	window.__ddgBorderInjected = true;

	const defaultSettings = { enabled: true, color: '#ff6a00', thickness: 10 };

	const useChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

	function saveSettings(settings) {
		try {
			if (useChromeStorage) {
				chrome.storage.local.set({ ddgBorderSettings: settings });
			} else {
				localStorage.setItem('ddgBorderSettings', JSON.stringify(settings));
			}
		} catch (e) {
			console.error('Failed to save settings', e);
		}
	}

	function loadSettings(cb) {
		try {
			if (useChromeStorage) {
				chrome.storage.local.get(['ddgBorderSettings'], res => {
					const s = Object.assign({}, defaultSettings, res.ddgBorderSettings || {});
					cb(s);
				});
			} else {
				const raw = localStorage.getItem('ddgBorderSettings');
				let parsed = {};
				try { parsed = raw ? JSON.parse(raw) : {}; } catch (e) {}
				cb(Object.assign({}, defaultSettings, parsed));
			}
		} catch (e) {
			console.error('Failed to load settings', e);
			cb(defaultSettings);
		}
	}

	function applyBorder(settings) {
		if (settings && settings.enabled) {
			document.body.style.border = settings.thickness + 'px solid ' + settings.color;
		} else {
			document.body.style.border = '';
		}
	}

	// Create floating button
	const btn = document.createElement('button');
	btn.className = 'ddg-border-btn';
	btn.setAttribute('aria-label', 'DuckDuckGo Border settings');
	btn.setAttribute('title', 'DuckDuckGo Border settings');
	btn.innerHTML = `
		<svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<circle cx="50" cy="50" r="48" fill="#ffdd59" />
			<circle cx="50" cy="50" r="48" fill="none" stroke="#f4a261" stroke-width="2" />
			<circle cx="46" cy="38" r="6" fill="#222" />
			<path d="M64 52c6 0 10-4 10-9 0-4-4-9-10-9-3 0-6 1-8 2" fill="#f39c12" />
		</svg>
	`;

	// Create popup container
	const popup = document.createElement('div');
	popup.className = 'ddg-popup';
	popup.setAttribute('role', 'dialog');
	popup.setAttribute('aria-hidden', 'true');
	popup.innerHTML = `
		<div class="ddg-popup-row">
			<label><input type="checkbox" class="ddg-enable"> Enable border</label>
		</div>
		<div class="ddg-popup-row">
			<label for="ddg-color">Color</label>
			<select id="ddg-color" class="ddg-color">
				<option value="#ff6a00">Orange</option>
				<option value="#1e90ff">Blue</option>
				<option value="#28a745">Green</option>
				<option value="#6f42c1">Purple</option>
				<option value="#e83e8c">Pink</option>
				<option value="#17a2b8">Teal</option>
				<option value="#ffc107">Amber</option>
				<option value="#20c997">Mint</option>
				<option value="#343a40">Charcoal</option>
				<option value="#6c757d">Gray</option>
			</select>
		</div>
		<div class="ddg-popup-row">
			<label for="ddg-thickness">Thickness: <span class="ddg-thickness-value"></span>px</label>
			<input id="ddg-thickness" class="ddg-thickness" type="range" min="0" max="40" step="1">
		</div>
		<div class="ddg-popup-row ddg-actions">
			<button class="ddg-close">Close</button>
		</div>
	`;

	// Append to document
	// Use documentElement (html) to ensure button shows on pages that modify body styles heavily.
	(document.documentElement || document.body).appendChild(btn);
	(document.documentElement || document.body).appendChild(popup);

	// Wire UI
	const checkbox = popup.querySelector('.ddg-enable');
	const colorSelect = popup.querySelector('.ddg-color');
	const thicknessRange = popup.querySelector('.ddg-thickness');
	const thicknessValue = popup.querySelector('.ddg-thickness-value');
	const closeBtn = popup.querySelector('.ddg-close');

	function showPopup() {
		popup.classList.add('visible');
		popup.setAttribute('aria-hidden', 'false');
		// focus first control
		checkbox.focus();
	}

	function hidePopup() {
		popup.classList.remove('visible');
		popup.setAttribute('aria-hidden', 'true');
	}

	btn.addEventListener('click', (e) => {
		e.stopPropagation();
		if (popup.classList.contains('visible')) hidePopup(); else showPopup();
	});

	closeBtn.addEventListener('click', () => hidePopup());

	// close when clicking outside
	document.addEventListener('click', (e) => {
		if (!popup.contains(e.target) && !btn.contains(e.target)) {
			hidePopup();
		}
	}, true);

	// Keyboard: Esc closes
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') hidePopup();
	});

	// Sync UI with settings
	loadSettings((settings) => {
		checkbox.checked = !!settings.enabled;
		colorSelect.value = settings.color || defaultSettings.color;
		thicknessRange.value = settings.thickness || defaultSettings.thickness;
		thicknessValue.textContent = thicknessRange.value;
		applyBorder(settings);
	});

	// Handlers
	checkbox.addEventListener('change', () => {
		loadSettings((s) => {
			s.enabled = !!checkbox.checked;
			saveSettings(s);
			applyBorder(s);
		});
	});

	colorSelect.addEventListener('change', () => {
		loadSettings((s) => {
			s.color = colorSelect.value;
			saveSettings(s);
			applyBorder(s);
		});
	});

	thicknessRange.addEventListener('input', () => {
		thicknessValue.textContent = thicknessRange.value;
		loadSettings((s) => {
			s.thickness = parseInt(thicknessRange.value, 10) || 0;
			saveSettings(s);
			applyBorder(s);
		});
	});

}

