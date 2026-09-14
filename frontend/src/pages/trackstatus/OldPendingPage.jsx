import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ErrorPage from '../ErrorPage';
import approvalPendingImg from '../../assets/status/approval_pending.svg';
import deloitte_theme from '../../theme';
import { useEffect } from 'react';
import { showToast } from '../../components/toastService';

const PendingPage = () => {
  const navigate = useNavigate();
  const { document_flag, payment_flag, entity_type, sector_type, created_at, updated_at } = useSelector((state) => state.login);

  const handleRedirectAfterDocumentApprove = () => {
    if (entity_type === 'NOBE' && sector_type !== "FIRM") {
      if (payment_flag) {
        showToast({
          title: "Your Registration has been completed",
          description: "The Username and Password has been sent to the respective mobile number",
          status: "info"
        })
      } else {
        showToast({
          title: "Some error occured in registration.",
          description: "Please contact to Admin.",
          status: "error"
        })
      }
      navigate('/');
    } else {
      navigate('/payment-dashboard');
    }
  }

  useEffect(() => {
    if (document_flag == 1) {
      handleRedirectAfterDocumentApprove();
    } else if (document_flag == 2) {
      navigate('/document-rejected');
    } else if (document_flag == 0) {
      // stay on this page
    } else {
      <ErrorPage
        statusCode={500}
        customMessage="Invalid document status."
      />
    }
  }, [document_flag])

  return (
    <div style={{
      padding: deloitte_theme.paddingX,
    }}>
      {
        document_flag == 0 ?
          (
            <div className='flex flex-row justify-evenly items-center'>
              {/* Left side - Image */}
              <div className='flex justify-center items-center'>
                <img
                  src={approvalPendingImg}
                  alt="Approval Pending"
                  className='w-[90%] max-w-[534px] h-auto object-contain'
                />
              </div>

              {/* Right side - Content - Same as approved state */}
              <div style={{ flex: '1', maxWidth: '50%' }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4%' }}>
                  <div style={{ width: '24px', height: '24px', backgroundColor: '#fb923c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '3%' }}>
                    <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: '#f97316', fontWeight: '600', fontSize: '1.125rem' }}>
                    Approval Pending - Document in Review
                  </span>
                </div>

                {/* Main Heading */}
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fb923c', marginBottom: '3%' }}>
                  Awaiting Verification by BEE
                </h1>

                {/* Description */}
                <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '4%' }}>
                  Your Documents are under Review. You can make the payment once they are Verified.
                </p>

                {/* Important Dates */}
                <div style={{ marginBottom: '4%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <span style={{ color: '#6b7280' }}>Application Submitted On:</span>
                    <span style={{ color: '#1f2937' }}>{created_at ? new Date(created_at).toLocaleDateString('en-GB') : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Last Updated On:</span>
                    <span style={{ color: '#1f2937' }}>{updated_at ? new Date(updated_at).toLocaleDateString('en-GB') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) :
          (
            <div className='flex w-full h-full justify-center items-center'>
              <h1>Redirecting to payment page ...</h1>
            </div>
          )
      }
    </div>
  );
};

export default PendingPage;