import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReleaseTable } from '../release-table/release-table';

@Component({
  selector: 'app-releases',
  imports: [ReleaseTable],
  templateUrl: './releases.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Releases {}
