import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface DownloadOptions {
  flowElement: HTMLElement;
  downloadFormat: 'PNG' | 'JPEG' | 'PDF';
  downloadResolution: '低' | '中' | '高';
  selectedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  flowName: string;
  zoom: number;
}

export const handleDownload = async ({
  flowElement,
  downloadFormat,
  downloadResolution,
  selectedArea,
  flowName,
  zoom,
}: DownloadOptions): Promise<void> => {
  const scaleMap: Record<'低' | '中' | '高', number> = {
    '低': 1,
    '中': 2,
    '高': 3,
  };
  const scale = scaleMap[downloadResolution];

  let dataUrl;
  try {
    const options = {
      backgroundColor: '#ffffff',
      width: selectedArea.width * scale,
      height: selectedArea.height * scale,
      style: {
        transform: `translate(${-selectedArea.x * scale}px, ${-selectedArea.y * scale}px) scale(${scale})`,
        transformOrigin: 'top left',
        width: `${flowElement.clientWidth}px`,
        height: `${flowElement.clientHeight}px`,
      },
      pixelRatio: scale, // zoomを除外し、scaleのみに設定
    };

    // デバッグログを追加
    console.log('Download Options:', options);

    if (downloadFormat === 'PNG' || downloadFormat === 'JPEG') {
      const imageFunction = downloadFormat === 'PNG' ? toPng : toJpeg;
      dataUrl = await imageFunction(flowElement, options);
    } else if (downloadFormat === 'PDF') {
      const imgData = await toPng(flowElement, options);
      const pdf = new jsPDF({
        orientation: selectedArea.width > selectedArea.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [selectedArea.width * scale, selectedArea.height * scale],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, selectedArea.width * scale, selectedArea.height * scale);
      pdf.save(`${flowName}.pdf`);
      return;
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return;
  }

  if (dataUrl) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${flowName}.${downloadFormat.toLowerCase()}`;
    link.click();
  }
};