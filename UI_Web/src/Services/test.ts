import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import AnalysisRequest2D from '../Interfaces/AnalysisRequest2D';
import AnalysisResponse2D from '../Interfaces/AnalysisResponse2D';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  constructor(private readonly http: HttpClient) {}

  post(data: AnalysisRequest2D) {
    return this.http.post<AnalysisResponse2D>('http://localhost:8000/simple_supported_beam', data);
  }
}
