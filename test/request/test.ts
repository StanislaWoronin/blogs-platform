import { Blogger } from './blogger';
import { Blogs } from './blogs';
import { Comments } from './comments';
import { Factories } from '../helper/factories';
import { Posts } from './posts';
import { SA } from './sa';
import { Testing } from './testing';
import { Integration } from './integration';

export class TEST {
  private readonly server: any;
  constructor(server) {
    this.server = server;
  }

  blogger() {
    return new Blogger(this.server);
  }

  blogs() {
    return new Blogs(this.server);
  }

  comments() {
    return new Comments(this.server);
  }

  factories() {
    return new Factories(this.server, this.blogger());
  }

  posts() {
    return new Posts(this.server);
  }

  sa() {
    return new SA(this.server);
  }

  testing() {
    return new Testing(this.server);
  }

  integration() {
    return new Integration(this.server);
  }
}
