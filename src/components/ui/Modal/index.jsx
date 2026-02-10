import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

const Modal = ({ children }) => {
    return (
        createPortal(
            <div className={styles.overlay}>
                <div className={styles.content}>
                    {children}
                </div>
            </div>,
            document.body
        )
    )
}

export default Modal;