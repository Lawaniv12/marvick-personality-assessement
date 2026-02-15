import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-email-capture',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './email-capture.component.html',
  styleUrl: './email-capture.component.scss'
})
export class EmailCaptureComponent {
  email = ''
}
