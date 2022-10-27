import { Component } from '@angular/core';
  const cohere = require('cohere-ai');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  generated: string[] = [];
  prompt: string = '';

  constructor(){
    cohere.init('<api-here>');
  }

  async generateCopy(){
    const generateResponse = await cohere.generate({
      model: "large",
      prompt: this.prompt,
      max_tokens: 100,
      temperature: 1,
    });
    // concatenate the prompt and the generated text to 
    this.generated.push(this.prompt + generateResponse.body.generations[0].text)
  }
}
