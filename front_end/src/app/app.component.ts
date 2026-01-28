import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // CORREÇÃO NOS NOMES ABAIXO:
  templateUrl: './app.component.html', // Era './app.html'
  styleUrl: './app.component.scss'     // Era './app.scss'
})
export class AppComponent {
  title = 'frontend';
}