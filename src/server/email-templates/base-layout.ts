export function getBaseLayoutHTML(_title: string, content: string, color: string = '#1976d2'): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 25px; border-radius: 8px; border-top: 5px solid ${color}; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 15px; margin-bottom: 25px; border-bottom: 1px solid #eee; }
            .logo { color: ${color}; font-size: 22px; font-weight: bold; }
            .content { line-height: 1.65; font-size: 15px; }
            .content h2 { color: ${color}; margin-top:0; }
            .content p { margin-bottom: 15px; }
            .project-info, .info-box { background: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .project-info p, .info-box p { margin-bottom: 8px; }
            .project-info strong, .info-box strong { color: #555; }
            .action-button { display: inline-block; background-color: ${color}; color: white !important; padding: 12px 22px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 13px; color: #777; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>Esta é uma mensagem automática. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `
}
