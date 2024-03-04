import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef,ChangeDetectorRef, Inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule,HttpClientModule],
})
export class AppComponent {
  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(HttpClient) private http: HttpClient,
  ) {}

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private image!: HTMLImageElement;
  selection: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private maxCanvasWidth: number = 1200;
  private maxCanvasHeight: number = 1000;
  savedSelections: any[] = [];

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
        this.canvas.nativeElement.height = Math.max(
          1,
          this.maxCanvasWidth / aspectRatio,
        );
      } else {
        this.canvas.nativeElement.height = this.maxCanvasHeight;
        this.canvas.nativeElement.width = Math.max(
          1,
          this.maxCanvasHeight * aspectRatio,
        );
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
    this.ctx.strokeStyle = '#00ABEB';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.selection.x,
      this.selection.y,
      this.selection.width,
      this.selection.height,
    );
    this.ctx.setLineDash([4, 2]);
  }

  addSavedSelection(url: string) {
    if (url.startsWith('data:image')) {
      this.savedSelections.push(url);
    }
  }

  saveSelection() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    const x = Math.min(this.startX, this.startX + this.selection.width);
    const y = Math.min(this.startY, this.startY + this.selection.height);
    const width = Math.abs(this.selection.width);
    const height = Math.abs(this.selection.height);

    tempCanvas.width = width;
    tempCanvas.height = height;

    tempCtx.drawImage(
      this.canvas.nativeElement,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height,
    );

    tempCanvas.toBlob((blob: Blob | null) => {
      if (blob) {
        const formData = new FormData();
        formData.append('file', blob, 'recorte_da_imagem.png');
        console.log(formData)
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recorte_da_imagem.png';
        link.click();
        URL.revokeObjectURL(url);
        console.log(formData)

        const savedSelection = {
          url: url,
          link: tempCanvas.toDataURL(),
          width: width,
          height: height,
        };
        
        this.savedSelections.push(savedSelection);
        
        
        this.cdr.detectChanges();
        this.http.post('http://172.18.1.27:5001/predict', formData).subscribe(
          (response) => {
            console.log('Imagem recortada enviada com sucesso:', response);
            // Faça qualquer outra ação necessária após enviar a imagem para a API
          },
          (error) => {
            console.error('Erro ao enviar imagem recortada para a API:', error);
            console.log(formData)
            console.log(blob)
            // Lide com o erro de envio da imagem para a API
          },
          );
          tempCtx.clearRect(0, 0, width, height);
      }
    }, 'image/png');
  }
}
