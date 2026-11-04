import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-ticket-qr',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      canvas {
        display: block;
        width: 100%;
        max-width: 160px;
        height: auto;
      }
    `,
  ],
})
export class TicketQrComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) payload!: string;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private rendered = false;

  ngAfterViewInit(): void {
    this.render();
    this.rendered = true;
  }

  ngOnChanges(): void {
    if (this.rendered) {
      this.render();
    }
  }

  private render(): void {
    if (!this.canvasRef || !this.payload) {
      return;
    }
    QRCode.toCanvas(this.canvasRef.nativeElement, this.payload, { width: 160, margin: 1 });
  }
}
