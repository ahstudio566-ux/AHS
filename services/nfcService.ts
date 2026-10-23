
/**
 * NFC Service for DA NANG GREEN
 * Handles reading and writing NFC tags to trigger SOS or other actions.
 */

export const isNFCSupported = () => {
  return 'NDEFReader' in window;
};

export const startNFCScan = async (onSOS: () => void, onMessage: (msg: string) => void) => {
  if (!isNFCSupported()) {
    onMessage("Trình duyệt của bạn không hỗ trợ NFC. Vui lòng sử dụng Chrome trên Android.");
    return null;
  }

  try {
    const ndef = new (window as any).NDEFReader();
    await ndef.scan();
    console.log("NFC Scan started successfully.");

    ndef.addEventListener("readingerror", () => {
      onMessage("Lỗi khi đọc thẻ NFC. Vui lòng thử lại.");
    });

    ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
      console.log(`> Serial Number: ${serialNumber}`);
      console.log(`> Records: (${message.records.length})`);

      for (const record of message.records) {
        const textDecoder = new TextDecoder(record.encoding);
        const text = textDecoder.decode(record.data);
        console.log(`Record type: ${record.recordType}, data: ${text}`);

        // Check for SOS trigger
        if (text === "DANANGGREEN_SOS" || text.includes("/sos")) {
          onSOS();
          return;
        }
      }
    });

    return ndef;
  } catch (error) {
    console.error("NFC Scan Error:", error);
    onMessage(`Không thể khởi động NFC: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

export const writeNFCSOSTag = async (onMessage: (msg: string, type: 'success' | 'error') => void) => {
  if (!isNFCSupported()) {
    onMessage("Trình duyệt của bạn không hỗ trợ NFC.", 'error');
    return;
  }

  try {
    const ndef = new (window as any).NDEFReader();
    // We need to write a URL that the browser can recognize to open the app, 
    // or just a text record if the app is already open.
    // The most reliable way is a URL that points to the app's SOS view.
    const appUrl = window.location.origin + "/?view=sos";
    
    await ndef.write({
      records: [
        { recordType: "url", data: appUrl },
        { recordType: "text", data: "DANANGGREEN_SOS" }
      ]
    });
    
    onMessage("Đã ghi thẻ NFC SOS thành công! Bây giờ bạn có thể chạm thẻ để mở SOS.", 'success');
  } catch (error) {
    console.error("NFC Write Error:", error);
    onMessage(`Lỗi khi ghi thẻ: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};
