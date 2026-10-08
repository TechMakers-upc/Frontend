import { Component, Directive, ElementRef, contentChild, inject, input } from '@angular/core';
import { NgControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

function errorMessage(errors: ValidationErrors): { key: string; params?: Record<string, unknown> } {
  if (errors['required']) return { key: 'fields.errors.required' };
  if (errors['minlength']) return { key: 'fields.errors.minLength', params: errors['minlength'] };
  if (errors['maxlength']) return { key: 'fields.errors.maxLength', params: errors['maxlength'] };
  if (errors['min']) return { key: 'fields.errors.min', params: errors['min'] };
  if (errors['max']) return { key: 'fields.errors.max', params: errors['max'] };
  if (errors['email']) return { key: 'fields.errors.emailInvalid' };
  if (errors['url']) return { key: 'fields.errors.url' };
  if (errors['integer']) return { key: 'fields.errors.integer' };
  return { key: 'fields.errors.invalid' };
}

@Directive({
  selector: '[appFieldInput]',
  host: {
    class: 'field__input',
    placeholder: ' ',
    '[attr.aria-invalid]': 'showError',
    '[attr.aria-describedby]': 'showError ? id + "-error" : null',
  },
})
export class FieldInput {
  private readonly control = inject(NgControl, { self: true });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  get id(): string {
    return this.element.nativeElement.id;
  }

  get showError(): boolean {
    return !!this.control.invalid && !!this.control.touched;
  }
}


@Component({
  selector: 'app-field',
  imports: [TranslatePipe],
  templateUrl: './field.html',
  styleUrl: './field.css',
})
export class Field {
  readonly for = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly floating = input(false);

  private readonly control = contentChild(NgControl, { descendants: true });

  protected error(): { key: string; params?: Record<string, unknown> } | null {
    const control = this.control();
    if (!control || !control.invalid || !control.touched || !control.errors) return null;
    return errorMessage(control.errors);
  }
}
