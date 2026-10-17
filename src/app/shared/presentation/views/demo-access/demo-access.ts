import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionStore } from '../../../application/session.store';
import { Role } from '../../../domain/model/role';
import { ROLE_HOME } from '../../session/role-presentation';
import { BrandMark } from '../../components/brand-mark/brand-mark';
import { Icon } from '../../components/icon/icon';

@Component({
  selector: 'app-demo-access',
  imports: [BrandMark, Icon, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-access.html',
  styleUrl: './demo-access.css',
})
export class DemoAccess {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected choose(role: Role): void {
    this.session.selectDemoRole(role);
    void this.router.navigateByUrl(ROLE_HOME[role]);
  }
}
