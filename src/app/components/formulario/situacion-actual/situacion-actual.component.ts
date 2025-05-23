import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioComponent } from '../formulario.component';
import { preguntasPorDimension } from '../utils/preguntas-situacion-actual';

@Component({
  selector: 'app-situacion-actual',
  standalone: true,
  templateUrl: './situacion-actual.component.html',
  styleUrls: ['./situacion-actual.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class SituacionActualComponent implements OnInit {
  public formulario = inject(FormularioComponent);
  preguntasPorDimension = preguntasPorDimension;
  niveles = this.formulario.nivelesSituacionActual;
  dimensiones = this.preguntasPorDimension.map(d => d.dimension);
  respuestas = this.formulario.respuestasSituacionActual;
  errores = signal<Record<number, boolean>>({});
  currentStep = 1;
  total = this.getTotal();
  anwers: any = {};
  hideHeader = false;
  ngOnInit(): void {

  }

  @ViewChild('formContent') formContent!: ElementRef<HTMLDivElement>;
  getTotal(): number {
    let total = 0;
    for (let item of preguntasPorDimension) {
      total += item.preguntas.length;
    }
    return total;
  }

  private scrollToTop() {
    if (this.formContent) {
      this.formContent.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  actualizarRespuesta(preguntaId: number, nivel: number) {
    this.respuestas.update(r => ({ ...r, [preguntaId]: nivel }));
    this.errores.update(e => ({ ...e, [preguntaId]: false }));
    localStorage.setItem('respuestasSituacionActual', JSON.stringify(this.respuestas()));
  }
  getProgressPercentage(): number {
    const procentage = (Object.keys(this.respuestas()).length / this.total) * 100;
    return procentage;
  }
  todasRespondidas(): boolean {
    return this.preguntasPorDimension.every(dimension =>
      dimension.preguntas.every(p => this.respuestas()[p.id] !== undefined)
    );
  }
  todasRespondidasBloque(): boolean {
    return this.preguntasPorDimension[this.currentStep - 1].preguntas.every(p => this.respuestas()[p.id] !== undefined);
  }
  siguientePaso() {
    if (this.todasRespondidas()) {
      this.formulario.siguientePaso();
    } else {
      this.marcarErrores();
    }
  }
  setStep(step: number) {
    this.currentStep = step;
  }
  intentarAvanzar() {
    if (this.currentStep < preguntasPorDimension.length) {
      if (this.todasRespondidasBloque()) {
        this.anwers[this.currentStep - 1] = true;
        this.scrollToTop();
        this.currentStep++;
      } else {
        this.marcarErrores();
      }
    } else {
      if (this.todasRespondidas()) {
        this.siguientePaso();
      } else {
        if (this.todasRespondidasBloque()) {
          this.anwers[this.currentStep - 1] = true;
          const steps = [0, 1, 2, 3, 4, 5, 6, 7, 8];
          for (let step of steps) {
            if (!this.anwers[step]) {
              this.currentStep = step + 1;
              this.marcarErrores();
              break;
            }
          }
        } else {
          this.marcarErrores();
        }
      }
    }
  }

  private marcarErrores() {
    const nuevosErrores: Record<number, boolean> = {};
    preguntasPorDimension[this.currentStep - 1].preguntas.forEach(p => {
      if (this.respuestas()[p.id] === undefined) {
        nuevosErrores[p.id] = true;
      }
    });
    this.errores.set(nuevosErrores);
  }
}
