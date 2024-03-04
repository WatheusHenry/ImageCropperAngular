import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AppComponent {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private image!: HTMLImageElement;
  private selection: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private maxCanvasWidth: number = 800;
  private maxCanvasHeight: number = 600;
  savedSelections: string[] = [];

  ngAfterViewInit() {
    const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;
    this.ctx = canvasElement.getContext('2d')!;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.image = new Image();
      this.image.src = reader.result as string;
      this.image.onload = () => {
        this.fitCanvasToImage();
        this.drawOnCanvas();
      };
    };
    reader.readAsDataURL(file);
  }

  fitCanvasToImage() {
    if (
      this.image.width <= this.maxCanvasWidth &&
      this.image.height <= this.maxCanvasHeight
    ) {
      this.canvas.nativeElement.width = this.image.width;
      this.canvas.nativeElement.height = this.image.height;
    } else {
      const aspectRatio = this.image.width / this.image.height;
      if (aspectRatio > this.maxCanvasWidth / this.maxCanvasHeight) {
        this.canvas.nativeElement.width = this.maxCanvasWidth;
        this.canvas.nativeElement.height = this.maxCanvasWidth / aspectRatio;
      } else {
        this.canvas.nativeElement.height = this.maxCanvasHeight;
        this.canvas.nativeElement.width = this.maxCanvasHeight * aspectRatio;
      }
    }
  }

  drawOnCanvas() {
    if (this.ctx && this.image) {
      this.ctx.clearRect(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height,
      );
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height,
      );
    }
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.offsetX;
    this.startY = event.offsetY;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const currentX = event.offsetX;
      const currentY = event.offsetY;
      const width = currentX - this.startX;
      const height = currentY - this.startY;
      this.selection = { x: this.startX, y: this.startY, width, height };
      this.drawSelection();
    }
  }

  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }

  drawSelection() {
    this.ctx.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height,
    );
    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height,
    );
    this.ctx.strokeStyle = 'gray';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.selection.x,
      this.selection.y,
      this.selection.width,
      this.selection.height,
    );
  }

  addSavedSelection(url: string) {
    if (url.startsWith('data:image')) {
      this.savedSelections.push(url);
    }
  }

  saveSelection() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCanvas.width = this.selection.width;
    tempCanvas.height = this.selection.height;

    tempCtx.drawImage(
      this.canvas.nativeElement,
      this.selection.x,
      this.selection.y,
      this.selection.width,
      this.selection.height,
      0,
      0,
      this.selection.width,
      this.selection.height,
    );

    tempCanvas.toBlob((blob: Blob | null) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recorte_da_imagem.png';
        link.click();
        URL.revokeObjectURL(url);

        this.addSavedSelection(url);
        console.log(this.savedSelections);
        this.addSavedSelection(tempCanvas.toDataURL());

        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
    }, 'image/png');
  }
}
