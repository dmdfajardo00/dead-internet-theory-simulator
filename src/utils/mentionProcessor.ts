import { Persona } from '@/types';

export interface ProcessedComment {
  formatted: string;
  mentions: Mention[];
}

export interface Mention {
  name: string;
  nickname: string;
  position: number;
  fullName: string;
}

export class MentionProcessor {
  static process(comment: string, personas: Persona[]): ProcessedComment {
    const mentions: Mention[] = [];
    let formattedComment = comment;
    
    // Create nickname mapping
    const nicknameMap = this.createNicknameMap(personas);
    
    // Process each potential mention
    Object.entries(nicknameMap).forEach(([nickname, fullName]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(nickname)}\\b`, 'gi');
      const matches = [...comment.matchAll(regex)];
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          mentions.push({
            name: fullName,
            nickname,
            position: match.index,
            fullName
          });
          
          // Replace with formatted mention
          formattedComment = formattedComment.replace(
            match[0],
            `**@${fullName}**`
          );
        }
      });
    });
    
    return { formatted: formattedComment, mentions };
  }

  private static createNicknameMap(personas: Persona[]): Record<string, string> {
    const map: Record<string, string> = {};
    
    personas.forEach(persona => {
      // Extract first name
      const firstName = persona.name.split(' ')[0].replace(/"/g, '');
      map[firstName.toLowerCase()] = persona.name;
      
      // Handle special cases with quotes (nicknames)
      if (persona.name.includes('"')) {
        const nickname = persona.name.match(/"([^"]+)"/)?.[1];
        if (nickname) {
          map[nickname.toLowerCase()] = persona.name;
        }
      }
      
      // Handle titles and special names
      if (persona.name.includes('Ka ')) {
        const afterKa = persona.name.split('Ka ')[1]?.split(' ')[0];
        if (afterKa) {
          map['ka'] = persona.name;
          map[afterKa.toLowerCase().replace(/"/g, '')] = persona.name;
        }
      }
      
      if (persona.name.includes('SPO3')) {
        map['cardo'] = persona.name;
        map['solomon'] = persona.name;
      }
      
      if (persona.name.includes('Tita')) {
        map['tita'] = persona.name;
        map['tess'] = persona.name;
      }
      
      // Handle common shortened names
      if (persona.name.includes('Benjamin')) {
        map['ben'] = persona.name;
      }
      if (persona.name.includes('Katrina')) {
        map['kat'] = persona.name;
      }
      if (persona.name.includes('Renato')) {
        map['reny'] = persona.name;
      }
      if (persona.name.includes('Eduardo')) {
        map['ed'] = persona.name;
      }
      if (persona.name.includes('Teresita')) {
        map['tess'] = persona.name;
      }
      if (persona.name.includes('Angela')) {
        map['gela'] = persona.name;
      }
      if (persona.name.includes('Ricardo')) {
        map['cardo'] = persona.name;
      }
    });
    
    return map;
  }

  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}