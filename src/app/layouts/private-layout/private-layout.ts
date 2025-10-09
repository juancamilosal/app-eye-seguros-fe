import { Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Sidebard} from '../../components/sidebard/sidebard';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [Sidebard, RouterOutlet],
  templateUrl: './private-layout.html'
})
export class PrivateLayout {

}
