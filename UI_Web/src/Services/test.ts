import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  constructor(private readonly http: HttpClient) {}

  get<T>() {
    return this.http.get<T>('http://localhost:8000/simple_supported_beam');
  }

  post<T>(data: any) {
    return this.http.post<T>('http://localhost:8000/simple_supported_beam', data);
  }
}
