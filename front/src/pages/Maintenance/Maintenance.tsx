import { useEffect } from 'react';
import './Maintenance.css';


function Maintenance() {

    useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="maintenance-page">
            <div className="maintenance-container">
                <div className="maintenance-content">
                    <div className="maintenance-icon">
                        🔧
                    </div>
                    
                    <h1 className="maintenance-title">
                        Site en maintenance
                    </h1>
                    
                    <p className="maintenance-subtitle">
                        Nous mettons à jour nos services pour vous offrir une meilleure expérience.
                    </p>
                    
                    <div className="maintenance-details">
                        <p>Nous reviendrons bientôt avec :</p>
                        <ul>
                            <li>✨ De nouvelles fonctionnalités</li>
                            <li>🚀 Des performances améliorées</li>
                            <li>🎨 Une interface encore plus belle</li>
                            <li>🍽️ Plus de restaurants partenaires</li>
                        </ul>
                    </div>
                    
                    <div className="maintenance-time">
                        <p>Merci de votre patience.</p>
                        <p>Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</p>
                    </div>
                    
                    <div className="maintenance-contact">
                        <p>En cas d'urgence, contactez-nous :</p>
                        <a href="mailto:support@ufood.com" className="contact-link">
                            📧 support@ufood.com
                        </a>
                    </div>
                </div>
                
                <div className="maintenance-animation">
                    <div className="gear gear-1">⚙️</div>
                    <div className="gear gear-2">⚙️</div>
                    <div className="gear gear-3">⚙️</div>
                </div>
            </div>
        </div>
    );
}

export default Maintenance;