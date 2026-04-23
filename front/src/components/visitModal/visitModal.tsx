import { useState, useEffect } from 'react';
import './visitModal.css';

interface VisitModalProps {
  restaurant: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSave: (visitData: { date: string; rating: number; comment: string }) => Promise<void>;
  readOnly?: boolean;
  showDetailsButton?: boolean;
  onViewDetails?: () => void;
  defaultDate?: string;
  defaultRating?: number;
  defaultComment?: string;
}

export default function VisitModal({ 
  restaurant, 
  onClose, 
  onSave,
  readOnly = false,
  showDetailsButton = false,
  onViewDetails,
  defaultDate = '',
  defaultRating = 0,
  defaultComment = ''
}: VisitModalProps) {
  const [date, setDate] = useState(defaultDate);
  const [rating, setRating] = useState(defaultRating);
  const [comment, setComment] = useState(defaultComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dateError, setDateError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');
  
  const today = new Date().toISOString().split('T')[0];

  // Format date for date input display
  useEffect(() => {
    if (defaultDate) {
      try {
        const dateObj = new Date(defaultDate);
        const formattedDate = dateObj.toISOString().split('T')[0];
        setDate(formattedDate);
        console.log('📅 Date formatted:', defaultDate, '->', formattedDate);
      } catch (error) {
        console.error('Date formatting error:', error);
        setDate(defaultDate);
      }
    }
  }, [defaultDate]);

  const handleSubmit = async (e?: React.MouseEvent) => {
    console.log('🎬 handleSubmit called');
    e?.preventDefault();
    
    setDateError('');
    setRatingError('');
    setCommentError('');

    let hasError = false;

    if (!date) {
      setDateError('Visit date is required');
      hasError = true;
    }

    if (!rating || rating < 1) {
      setRatingError('Please rate the restaurant');
      hasError = true;
    } else if (rating < 1 || rating > 5) {
      setRatingError('Rating must be between 1 and 5');
      hasError = true;
    }

    if (!comment || comment.trim() === '') {
      setCommentError('Comment is required');
      hasError = true;
    }

    if (hasError) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation successful, calling onSave');
    setIsSubmitting(true);
    try {
      console.log('📤 Calling onSave with:', { date, rating, comment });
      await onSave({ date, rating, comment });
      console.log('✅ onSave completed');
      onClose();
    } catch (error) {
      console.error('❌ Error saving:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="visit-modal-overlay" onClick={handleOverlayClick}>
      <div className="visit-modal">
        <div className="visit-modal-header">
          <h2>Visit to {restaurant.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="visit-modal-body">
          <div className="form-group">
            <label htmlFor="visit-date">Visit Date: <span className="required">*</span></label>
            <input
              id="visit-date"
              type="date"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDate(e.target.value);
                setDateError('');
              }}
              max={today}
              required
              readOnly={readOnly}
              className={dateError ? 'error' : ''}
            />
            {dateError && <span className="error-message">{dateError}</span>}
            {readOnly && <p style={{fontSize: '0.85rem', color: 'var(--text-dark)', margin: '4px 0 0 0', opacity: 0.7}}>Read-only</p>}
          </div>

          <div className="form-group">
            <label htmlFor="visit-rating">Rating (1-5): <span className="required">*</span></label>
            <div className={`rating-input ${ratingError ? 'error' : ''}`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${rating >= star ? 'active' : ''}`}
                  onClick={() => {
                    if (!readOnly) {
                      setRating(star);
                      setRatingError('');
                    }
                  }}
                  disabled={readOnly}
                  style={{ cursor: readOnly ? 'default' : 'pointer', opacity: readOnly ? 0.7 : 1 }}
                >
                  {rating >= star ? '★' : '☆'}
                </button>
              ))}
              <span className="rating-value">{rating > 0 ? `${rating}/5` : 'Not rated'}</span>
            </div>
            {ratingError && <span className="error-message">{ratingError}</span>}
            {readOnly && <p style={{fontSize: '0.85rem', color: 'var(--text-dark)', margin: '4px 0 0 0', opacity: 0.7}}>Read-only</p>}
          </div>

          <div className="form-group">
            <label htmlFor="visit-comment">Comment: <span className="required">*</span></label>
            <textarea
              id="visit-comment"
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (!readOnly) {
                  setComment(e.target.value);
                  setCommentError('');
                }
              }}
              placeholder="Share your experience... (required)"
              rows={4}
              required
              readOnly={readOnly}
              className={commentError ? 'error' : ''}
              style={{ cursor: readOnly ? 'default' : 'text', opacity: readOnly ? 0.8 : 1 }}
            />
            {commentError && <span className="error-message">{commentError}</span>}
            {readOnly && <p style={{fontSize: '0.85rem', color: 'var(--text-dark)', margin: '4px 0 0 0', opacity: 0.7}}>Read-only</p>}
          </div>
        </div>

        <div className="visit-modal-actions">
          {!readOnly ? (
            <>
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {showDetailsButton && onViewDetails && (
                <button
                  className="btn-details"
                  onClick={onViewDetails}
                  type="button"
                >
                  View Restaurant Details
                </button>
              )}
              <button
                className="btn-close"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}