import React from 'react';
import { generateCertificatePDF } from '../../utils/generateCertificatePDF';
import { toast } from 'react-toastify';

const CertificateModal = ({ show, certificate, onClose, onDownload }) => {
  if (!show || !certificate) return null;

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
    } else {
      try {
        toast.info('Generating PDF... Please wait');
        await generateCertificatePDF(certificate);
        toast.success('Certificate downloaded successfully!');
      } catch (error) {
        console.error('Error downloading certificate:', error);
        toast.error('Failed to download certificate. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-start justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="glass-card rounded-2xl p-6 md:p-8 lg:p-12 max-w-2xl w-full border border-white/20 shadow-2xl my-8 max-h-[95vh] overflow-y-auto">
        {/* Confetti Effect */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl animate-bounce">
              <i className="ri-trophy-line text-white text-5xl"></i>
            </div>
            {/* Sparkles */}
            <div className="absolute -top-2 -left-2 text-yellow-400 text-2xl animate-ping">✨</div>
            <div className="absolute -top-2 -right-2 text-yellow-400 text-2xl animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="absolute -bottom-2 left-1/2 text-yellow-400 text-2xl animate-ping" style={{ animationDelay: '0.25s' }}>✨</div>
          </div>
          
          <h2 className="h2 text-white mb-3">🎉 Congratulations! 🎉</h2>
          <p className="body-large text-white/90 mb-2">
            You've successfully completed
          </p>
          <h3 className="h3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
            {certificate.courseName}
          </h3>
        </div>

        {/* Certificate Preview */}
        <div className="glass-light rounded-xl p-4 sm:p-6 border border-white/20 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Background Image */}
            {certificate.certificateData?.backgroundImage && (
              <img 
                src={certificate.certificateData.backgroundImage}
                alt="Certificate Background"
                className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-lg"
              />
            )}
            {/* Organization Logo */}
            {certificate.certificateData?.organizationLogo && (
              <div className="mb-4 flex justify-center relative z-10">
                <img 
                  src={certificate.certificateData.organizationLogo} 
                  alt="Organization Logo" 
                  className="h-12 object-contain"
                />
              </div>
            )}
            
            {/* Award Icon (if no logo) */}
            {!certificate.certificateData?.organizationLogo && (
              <div className="mb-4 relative z-10">
                <i className="ri-award-line text-6xl text-blue-600"></i>
              </div>
            )}
            
            <h4 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">
              {certificate.certificateData?.title || 'Certificate of Completion'}
            </h4>
            <p className="text-gray-600 mb-4 relative z-10">
              {certificate.certificateData?.subtitle || 'This is to certify that'}
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4 relative z-10">
              {certificate.studentName}
            </p>
            <p className="text-gray-600 mb-4 relative z-10">
              {certificate.certificateData?.bodyText || 'has successfully completed the course'}
            </p>
            <p className="text-sm text-gray-500 mb-4 italic relative z-10">
              {certificate.certificateData?.footerText || 'with distinction and dedication'}
            </p>
            
            {/* Signature Section */}
            <div className="border-t border-gray-300 pt-4 mt-4 relative z-10">
              <div className="flex items-end justify-between">
                {/* Left: Signature */}
                <div className="text-left">
                  {certificate.certificateData?.signatureImage && (
                    <img 
                      src={certificate.certificateData.signatureImage} 
                      alt="Signature" 
                      className="h-20 mb-2"
                    />
                  )}
                  {certificate.certificateData?.signatureName && (
                    <>
                      <p className="text-sm font-semibold text-gray-800 border-t border-gray-400 pt-1 inline-block min-w-[150px]">
                        {certificate.certificateData.signatureName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {certificate.certificateData?.signatureTitle || 'Instructor'}
                      </p>
                    </>
                  )}
                  {!certificate.certificateData?.signatureName && certificate.educatorName && (
                    <>
                      <p className="text-sm font-semibold text-gray-800 border-t border-gray-400 pt-1 inline-block min-w-[150px]">
                        {certificate.educatorName}
                      </p>
                      <p className="text-xs text-gray-600">Instructor</p>
                    </>
                  )}
                </div>
                
                {/* Right: Date & ID */}
                <div className="text-right text-xs text-gray-600">
                  <p className="mb-1">{new Date(certificate.completionDate).toLocaleDateString()}</p>
                  <p className="opacity-70">ID: {certificate.certificateId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-light rounded-xl p-4 border border-white/20 text-center">
            <i className="ri-medal-line text-3xl text-yellow-400 mb-2"></i>
            <p className="text-white/60 text-xs mb-1">Grade</p>
            <p className="text-white font-bold text-lg">{certificate.grade}%</p>
          </div>
          <div className="glass-light rounded-xl p-4 border border-white/20 text-center">
            <i className="ri-check-double-line text-3xl text-green-400 mb-2"></i>
            <p className="text-white/60 text-xs mb-1">Status</p>
            <p className="text-white font-bold text-sm">Completed</p>
          </div>
          <div className="glass-light rounded-xl p-4 border border-white/20 text-center">
            <i className="ri-calendar-check-line text-3xl text-blue-400 mb-2"></i>
            <p className="text-white/60 text-xs mb-1">Date</p>
            <p className="text-white font-bold text-sm">
              {new Date(certificate.completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <i className="ri-download-line text-xl"></i>
            Download Certificate (PDF)
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 glass-light text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2"
          >
            <i className="ri-close-line text-xl"></i>
            Close
          </button>
        </div>

        {/* Share */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-white/60 body-small mb-3">Share your achievement</p>
          <div className="flex items-center justify-center gap-3">
            <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center">
              <i className="ri-facebook-fill text-white"></i>
            </button>
            <button className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 transition-all flex items-center justify-center">
              <i className="ri-twitter-x-line text-white"></i>
            </button>
            <button className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 transition-all flex items-center justify-center">
              <i className="ri-linkedin-fill text-white"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;


