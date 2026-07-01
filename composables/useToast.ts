type ToastType = "info" | "success" | "warning" | "error";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const messages = useState<ToastMessage[]>("toast-messages", () => []);

  const remove = (id: number) => {
    messages.value = messages.value.filter((message) => message.id !== id);
  };

  const show = (message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    messages.value = [...messages.value, { id, message, type }];
    if (import.meta.client) {
      window.setTimeout(() => remove(id), 4200);
    }
  };

  return { messages, show, remove };
};
