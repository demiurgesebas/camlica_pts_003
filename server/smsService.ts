import { storage } from "./storage";

interface NetGSMResponse {
  status: string;
  jobID?: string;
  message?: string;
}

export class SMSService {
  private async getNetGSMCredentials() {
    const username = await storage.getSystemSetting('netgsm.username');
    const password = await storage.getSystemSetting('netgsm.password');
    const header = await storage.getSystemSetting('netgsm.header');
    
    if (!username?.value || !password?.value) {
      throw new Error('NetGSM kullanıcı adı ve şifre ayarlanmamış');
    }
    
    return {
      username: username.value,
      password: password.value,
      header: header?.value || 'NETGSM' // Varsayılan header
    };
  }

  async sendSMS(phoneNumber: string, message: string): Promise<NetGSMResponse> {
    try {
      const credentials = await this.getNetGSMCredentials();
      
      // Telefon numarasını temizle (0'ları ve +90'ı kaldır)
      const cleanPhone = phoneNumber.replace(/^(\+90|90|0)/, '').replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        throw new Error('Geçersiz telefon numarası formatı');
      }

      // NetGSM XML API formatı
      const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
    <header>
        <company>NETGSM</company>
        <usercode>${credentials.username}</usercode>
        <password>${credentials.password}</password>
        <type>1:n</type>
        <msgheader>${credentials.header}</msgheader>
    </header>
    <body>
        <msg><![CDATA[${message}]]></msg>
        <no>${cleanPhone}</no>
    </body>
</mainbody>`;

      const response = await fetch('https://api.netgsm.com.tr/sms/send/xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
        },
        body: xmlData,
      });

      const responseText = await response.text();
      
      // NetGSM yanıtını parse et
      if (responseText.includes('<![CDATA[00 ')) {
        // Başarılı - Job ID'yi çıkar
        const jobIDMatch = responseText.match(/\[CDATA\[00 (\d+)\]\]/);
        const jobID = jobIDMatch ? jobIDMatch[1] : '';
        
        return {
          status: 'success',
          jobID: jobID,
          message: 'SMS başarıyla gönderildi'
        };
      } else if (responseText.includes('<![CDATA[01]]>')) {
        throw new Error('Mesaj gövdesi hatalı veya mesaj metni yoktur');
      } else if (responseText.includes('<![CDATA[02]]>')) {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      } else if (responseText.includes('<![CDATA[03]]>')) {
        throw new Error('Kullanıcı adı veya şifre boş');
      } else if (responseText.includes('<![CDATA[04]]>')) {
        throw new Error('Müşteri aktif değil');
      } else if (responseText.includes('<![CDATA[05]]>')) {
        throw new Error('Geçersiz numara');
      } else if (responseText.includes('<![CDATA[06]]>')) {
        throw new Error('Mesaj başlığı onaylanmamış veya geçersiz');
      } else if (responseText.includes('<![CDATA[07]]>')) {
        throw new Error('Mesaj metni boş');
      } else {
        throw new Error(`NetGSM API hatası: ${responseText}`);
      }
      
    } catch (error) {
      console.error('SMS gönderim hatası:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  async sendBulkSMS(phoneNumbers: string[], message: string): Promise<NetGSMResponse[]> {
    const results: NetGSMResponse[] = [];
    
    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendSMS(phoneNumber, message);
      results.push(result);
      
      // SMS gönderim aralığı (rate limiting için)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const credentials = await this.getNetGSMCredentials();
      
      // Test mesajı gönder (kendi numarana)
      const testResponse = await this.sendSMS('5001234567', 'NetGSM bağlantı testi');
      
      if (testResponse.status === 'success') {
        return {
          success: true,
          message: 'NetGSM bağlantısı başarılı'
        };
      } else {
        return {
          success: false,
          message: testResponse.message || 'Bağlantı testi başarısız'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bağlantı hatası'
      };
    }
  }
}

export const smsService = new SMSService();