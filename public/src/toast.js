function createToastContainer() {
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 5%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80%;
      pointer-events: none;
    }
    .toast {
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
      width: 100%;
      margin-top: 10px;
      pointer-events: auto;
    }
    .toast.is-active {
      opacity: 1;
      transform: translateY(0);
    }
    .toast.fade-out {
      opacity: 0;
      transform: translateY(-20px);
    }
    .toast-message {
      background-color: #f5f5f5;
      color: gray;
      border-radius: 15px;
      padding: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
      width: 100%;
      font-family: fantasy, cursive, sans-serif;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

function showToast(message) {
  if (!document.getElementById('toast-container')) {
    createToastContainer();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-message">
      ${message}
      <button class="delete" onclick="hideToast(this)">&times;</button>
    </div>
  `;

  const container = document.getElementById('toast-container');
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-active');
  }, 100);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

function hideToast(button) {
  const toast = button.closest('.toast');
  if (toast) {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }
}
