import Dexie, { type Table } from 'dexie';
import { Lecture } from '@/types/lecture';

export class AulaScribeDatabase extends Dexie {
  lectures!: Table<Lecture, string>;

  constructor() {
    super('AulaScribeDB');
    this.version(1).stores({
      lectures: 'id, title, subject, createdAt, durationSeconds'
    });
  }
}

export const db = new AulaScribeDatabase();

// Helpers para operações comuns
export async function getAllLectures(): Promise<Lecture[]> {
  try {
    return await db.lectures.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    return [];
  }
}

export async function getLectureById(id: string): Promise<Lecture | undefined> {
  try {
    return await db.lectures.get(id);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    return undefined;
  }
}

export async function saveLecture(lecture: Lecture): Promise<string> {
  try {
    await db.lectures.put(lecture);
    return lecture.id;
  } catch (error) {
    console.error('Erro ao salvar aula no banco local:', error);
    throw error;
  }
}

export async function updateFlashcardMastery(lectureId: string, flashcardId: string, mastered: boolean): Promise<void> {
  try {
    const lecture = await db.lectures.get(lectureId);
    if (!lecture) return;
    
    const updatedFlashcards = lecture.flashcards.map(fc => 
      fc.id === flashcardId ? { ...fc, mastered } : fc
    );
    
    await db.lectures.update(lectureId, { flashcards: updatedFlashcards });
  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error);
  }
}

export async function deleteLecture(id: string): Promise<void> {
  try {
    await db.lectures.delete(id);
  } catch (error) {
    console.error('Erro ao excluir aula:', error);
    throw error;
  }
}
