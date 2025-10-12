import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private storage;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.storage = getStorage(this.app);
  }

  // อัพโหลดไฟล์ไปยัง Firebase Storage
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, `${path}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}