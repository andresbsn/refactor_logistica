import axios from 'axios';

/**
 * Service for external third-party API notifications
 */
export const externalService = {
  /**
   * Send a note/activity log to the municipal ticket panel
   * @param {Object} data - The data to send
   * @param {string|number} data.nro_ticket - The ticket number
   * @param {string} data.nota - The text content of the note
   * @param {string} data.foto - The URL of the image
   * @param {string|number} data.idusuario - The user ID performing the action
   * @returns {Promise}
   */
  sendTicketNote: async (data) => {
    try {
      const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3NDcyMzUyMjgsImV4cCI6MTc3ODc3MTIyOCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.ZH_rP5ksyNQEGXoG9YJ5yS1MWTn0aD_Vb4pROPaDO5w';

      console.log('[External API] Sending to:', 'https://test2panel147.muni-sn.com.ar/app/tickets/nota');

      const payload = {
        id_ticket: String(data.nro_ticket),
        nota: data.nota,
        agente: String(data.idusuario),
        fotos: data.foto ? [data.foto] : []
      };
      
      console.log('[External API] Payload:', JSON.stringify(payload));

      const response = await axios.post('https://test2panel147.muni-sn.com.ar/app/tickets/nota', payload, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      console.log('[External API] Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending external ticket note:', error);
      // We don't want to block the main flow if external notification fails
      // but we return the error in case the caller wants to handle it
      return { success: false, error: error.message };
    }
  }
};
