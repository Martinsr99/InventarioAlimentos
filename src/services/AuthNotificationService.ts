import Swal from 'sweetalert2';

interface NotificationOptions {
    title: string;
    message: string;
    type: 'success' | 'error';
    confirmButtonText: string;
}

const showNotification = ({
    title,
    message,
    type,
    confirmButtonText
}: NotificationOptions) => {
    let timerInterval: NodeJS.Timeout;
    let isHovered = false;

    return Swal.fire({
        title,
        text: message,
        icon: type,
        confirmButtonText,
        confirmButtonColor: '#3880ff',
        background: '#ffffff',
        heightAuto: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: 'auth-modal',
            title: 'auth-modal-title',
            htmlContainer: 'auth-modal-content',
            confirmButton: 'auth-modal-button'
        },
        didOpen: (popup) => {
            if (type === 'error') {
                popup.addEventListener('mouseenter', () => {
                    isHovered = true;
                    Swal.stopTimer();
                });
                popup.addEventListener('mouseleave', () => {
                    isHovered = false;
                    Swal.resumeTimer();
                });
            }
        },
        willClose: () => {
            clearInterval(timerInterval);
        }
    });
};

export const showError = (title: string, message: string, confirmButtonText: string) => {
    return showNotification({
        title,
        message,
        type: 'error',
        confirmButtonText
    });
};

export const showSuccess = (title: string, message: string, confirmButtonText: string) => {
    return showNotification({
        title,
        message,
        type: 'success',
        confirmButtonText
    });
};
