import { Component, ViewChild } from '@angular/core';
import { PageTitleComponent } from '../../../../shared/page-title/page-title.component';
import { CommonModule } from '@angular/common';
import { SimplebarAngularModule } from 'simplebar-angular';
import {
  allConversations,
  chatUser,
  contact,
  recentChats,
} from '../../../../data';
import { NavModule } from '../../../../Component/tab/tab.module';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { DrawerModule } from '../../../../Component/drawer';
import { MDModalModule } from '../../../../Component/modals';
import { MnDropdownComponent } from '../../../../Component/dropdown';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as Prism from 'prismjs';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    PageTitleComponent,
    CommonModule,
    SimplebarAngularModule,
    NavModule,
    LucideAngularModule,
    DrawerModule,
    MDModalModule,
    MnDropdownComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './chat.component.html',
  styles: ``,
  styleUrls: ['./chat.component.scss'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class ChatComponent {
  chatuser: any;
  recentChat: any;
  allConversations: any;
  showTab: boolean = true;
  contacts: any;
  chatuserData: any;
  groupData: any;
  contactData: any;
  messageData: any;
  formData!: UntypedFormGroup;
  username: string = 'William Heineman';
  usermessage!: string;
  profile: string = 'assets/images/users/avatar-7.png';
  role: string = 'NextJS Developer';

  isMenuCollapsed = false; // For Menu Collapse in false

  @ViewChild('scrollRef') scrollRef: any;
  constructor(
    public formBuilder: UntypedFormBuilder,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.chatuser = chatUser;
    this.recentChat = recentChats;
    this.allConversations = allConversations;
    this.contacts = contact;

    // Validation
    this.formData = this.formBuilder.group({
      chatMsg: ['', [Validators.required]],
    });
  }

  ngAfterViewInit() {
    this.scrollRef.SimpleBar.getScrollElement().scrollTop = 300;
    this.onListScroll();
  }

  ngAfterContentChecked() {
    Prism.highlightAll();
  }

  // toggletab
  setMainView(view: 'chat' | 'ai'): void {
    this.showTab = view === 'chat';
  }

  onListScroll() {
    if (this.scrollRef !== undefined) {
      setTimeout(() => {
        this.scrollRef.SimpleBar.getScrollElement().scrollTop =
          this.scrollRef.SimpleBar.getScrollElement().scrollHeight;
      }, 500);
    }
  }
  /***
   * OnClick User Chat show
   */
  chatUsername(name: any, avatar: any, role: any) {
    this.username = name;
    this.usermessage = 'Hello';
    this.chatuser = [];
    const currentDate = new Date();
    this.profile = avatar;
    this.role = role;

    this.chatuser.push({
      name: this.username,
      chatMsg: this.usermessage,
      time: currentDate.getHours() + ':' + currentDate.getMinutes(),
      avatar: avatar,
    });
  }

  // Send Message
  messageSave() {
    const chatMsg = this.formData.get('chatMsg')!.value;
    const currentDate = new Date();
    if (this.formData.valid && chatMsg) {
      // Message Push in Chat
      this.chatuser.push({
        name: 'Shawn',
        chatMsg,
        time: currentDate.getHours() + ':' + currentDate.getMinutes(),
        isSender: true,
      });

      this.onListScroll();
      // Set Form Data Reset
      this.formData = this.formBuilder.group({
        chatMsg: null,
      });
    }
    this.formData.reset();
  }

  toggleMenuCollapse(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
