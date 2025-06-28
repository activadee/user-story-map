import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IssueService } from '../../services/issue.service';
import { IssueCard } from '../issue-card/issue-card';

@Component({
  selector: 'app-issue-list',
  imports: [IssueCard],
  templateUrl: './issue-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueList {
  protected readonly issueService = inject(IssueService);
}
