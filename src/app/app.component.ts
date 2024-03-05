import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Inject,
} from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
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
    width: 600,
    height: 600,
  };
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private maxCanvasWidth: number = 1200;
  private maxCanvasHeight: number = 1000;
  savedSelections: any[] = [];
  fixedCropArea: boolean = false;


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

  toggleFixedCropArea() {
    this.fixedCropArea = !this.fixedCropArea;
    if (this.fixedCropArea) {
      this.selection = { x: 0, y: 0, width: 660, height: 660 };
      this.drawSelection();
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
    if (this.fixedCropArea) {
      const mouseX = event.offsetX;
      const mouseY = event.offsetY;
  
      // Verifica se o clique do mouse está dentro da área de recorte
      if (
        mouseX >= this.selection.x &&
        mouseX <= this.selection.x + this.selection.width &&
        mouseY >= this.selection.y &&
        mouseY <= this.selection.y + this.selection.height
      ) {
        this.isDragging = true;
        this.startX = mouseX - this.selection.x;
        this.startY = mouseY - this.selection.y;
      }
    } else {
      this.isDragging = true;
      this.startX = event.offsetX;
      this.startY = event.offsetY;
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      if (this.fixedCropArea) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
  
        // Calcula a nova posição da área de recorte fixa
        let newX = mouseX - this.startX;
        let newY = mouseY - this.startY;
  
        // Limita o movimento dentro dos limites do canvas
        newX = Math.max(0, Math.min(newX, this.canvas.nativeElement.width - 660));
        newY = Math.max(0, Math.min(newY, this.canvas.nativeElement.height - 660));
  
        // Define a nova posição da área de recorte fixa
        this.selection.x = newX;
        this.selection.y = newY;
  
        this.drawSelection();
      } else {
        const currentX = event.offsetX;
        const currentY = event.offsetY;
        const width = currentX - this.startX;
        const height = currentY - this.startY;
        this.selection = { x: this.startX, y: this.startY, width, height };
        this.drawSelection();
      }
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

    let x, y, width: number, height: number;

    if (this.fixedCropArea) {
      width = 660;
      height = 660;
      x = Math.min(Math.max(this.selection.x, 0), this.canvas.nativeElement.width - 660);
      y = Math.min(Math.max(this.selection.y, 0), this.canvas.nativeElement.height - 660);
    } else {
      x = Math.min(this.startX, this.startX + this.selection.width);
      y = Math.min(this.startY, this.startY + this.selection.height);
      width = Math.abs(this.selection.width);
      height = Math.abs(this.selection.height);
    }


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
        formData.append('file', blob, 'recorte_da_imagem.jpg');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recorte_da_imagem.jpg';
        link.click();
        URL.revokeObjectURL(url);

        let dadosApi: any;
        const savedSelection = {
          url: url,
          link: tempCanvas.toDataURL(),
          width: width,
          height: height,
          apiData: dadosApi, 
        };

        this.cdr.detectChanges();
        this.http.post('http://172.18.1.27:5001/predict', formData).subscribe(
          (response) => {
            savedSelection.apiData = response;
          },
          (error) => {
            console.error('Erro ao enviar imagem recortada para a API:', error);
          },
        );
        console.log(savedSelection);

        this.savedSelections.push(savedSelection);
        tempCtx.clearRect(0, 0, width, height);
      }
    }, 'image/png');
}
}
