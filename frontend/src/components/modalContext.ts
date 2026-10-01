import { createContext, useContext } from 'react';

export const ModalCloseContext = createContext<() => void>(() => {});

/** Tutup modal terdekat dengan animasi (dipakai form setelah berhasil simpan). */
export const useModalClose = () => useContext(ModalCloseContext);
