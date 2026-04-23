//<!-- From Uiverse.io by vinodjangid07 -->

import './loading.css';

function Loading() {
  return (
    <div className="loader">
      <div className="panWrapper">
        <div className="pan">
          <div className="food"></div>
          <div className="panBase"></div>
          <div className="panHandle"></div>
        </div>
        <div className="panShadow"></div>
      </div>
    </div>
  );
}

export default Loading;
