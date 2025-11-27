import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateCertificatePDF = async (certificate) => {
  try {
    // Create a temporary container for the certificate
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1200px'; // Fixed width for consistency
    container.style.padding = '0';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    // Build the certificate HTML with fixed layout
    const certificateHTML = `
      <div style="
        background: linear-gradient(to bottom right, #dbeafe, #e9d5ff);
        padding: 80px 100px;
        font-family: 'Georgia', serif;
        position: relative;
        width: 1200px;
        height: 848px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        ${certificate.certificateData?.backgroundImage ? `
          <img 
            src="${certificate.certificateData.backgroundImage}" 
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: 0.2;
            "
          />
        ` : ''}
        
        <div style="position: relative; z-index: 10;">
          <!-- Top Section -->
          <div style="text-align: center; margin-bottom: 40px;">
            ${certificate.certificateData?.organizationLogo ? `
              <div style="margin-bottom: 30px;">
                <img 
                  src="${certificate.certificateData.organizationLogo}" 
                  style="height: 70px; display: block; margin: 0 auto;"
                />
              </div>
            ` : ''}
            
            <h1 style="
              font-size: 44px;
              font-weight: bold;
              color: ${certificate.certificateData?.titleColor || '#1a1a1a'};
              margin: 0 0 20px 0;
              padding: 0;
            ">
              ${certificate.certificateData?.title || 'Certificate of Completion'}
            </h1>
            
            <p style="
              font-size: 20px;
              color: ${certificate.certificateData?.textColor || '#333333'};
              margin: 0 0 40px 0;
              padding: 0;
            ">
              ${certificate.certificateData?.subtitle || 'This is to certify that'}
            </p>
            
            <h2 style="
              font-size: 52px;
              font-weight: bold;
              color: #2563eb;
              margin: 0 0 40px 0;
              padding: 0;
            ">
              ${certificate.studentName}
            </h2>
            
            <p style="
              font-size: 20px;
              color: ${certificate.certificateData?.textColor || '#333333'};
              margin: 0 0 15px 0;
              padding: 0;
              line-height: 1.6;
            ">
              ${certificate.certificateData?.bodyText || 'has successfully completed the course'}
            </p>
            
            <p style="
              font-size: 16px;
              color: #6b7280;
              font-style: italic;
              margin: 0;
              padding: 0;
            ">
              ${certificate.certificateData?.footerText || 'with distinction and dedication'}
            </p>
          </div>
          
          <!-- Bottom Signature Section -->
          <div style="
            border-top: 3px solid #d1d5db;
            padding-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: end;
          ">
            <div style="text-align: left;">
              ${certificate.certificateData?.signatureImage ? `
                <img 
                  src="${certificate.certificateData.signatureImage}" 
                  style="height: 90px; margin-bottom: 10px; display: block;"
                />
              ` : ''}
              <div style="
                border-top: 2px solid #6b7280;
                padding-top: 8px;
                display: inline-block;
                min-width: 250px;
              ">
                <p style="
                  font-size: 16px;
                  font-weight: bold;
                  color: ${certificate.certificateData?.textColor || '#1a1a1a'};
                  margin: 0 0 5px 0;
                  padding: 0;
                ">
                  ${certificate.certificateData?.signatureName || certificate.educatorName}
                </p>
                <p style="
                  font-size: 14px;
                  color: ${certificate.certificateData?.textColor || '#333333'};
                  margin: 0;
                  padding: 0;
                ">
                  ${certificate.certificateData?.signatureTitle || 'Instructor'}
                </p>
              </div>
            </div>
            
            <div style="text-align: right;">
              <p style="
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 8px 0;
                padding: 0;
              ">${new Date(certificate.completionDate).toLocaleDateString()}</p>
              <p style="
                font-size: 14px;
                color: #6b7280;
                margin: 0;
                padding: 0;
                opacity: 0.8;
              ">Certificate ID: ${certificate.certificateId}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = certificateHTML;

    // Wait for images to load
    const images = container.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    });

    await Promise.all(imagePromises);

    // Give a small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate canvas from HTML with better settings
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: 848,
      windowWidth: 1200,
      windowHeight: 848,
      logging: false,
      imageTimeout: 0,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Generate filename
    const filename = `Certificate_${certificate.courseName.replace(/[^a-z0-9]/gi, '_')}_${certificate.certificateId}.pdf`;
    
    // Download PDF
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

