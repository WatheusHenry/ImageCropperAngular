import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
  
})
export class ImageUploadService {

  constructor(private http: HttpClient) { }

  uploadImage(imageBlob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', imageBlob, 'recorte_da_imagem.png');

    return this.http.post('http://172.18.1.27:5001/predict', formData);
  }
}