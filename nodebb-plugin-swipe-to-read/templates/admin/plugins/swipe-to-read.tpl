<div class="acp-page-container">
	<div class="row m-0">
		<div class="col-12 col-md-8 px-0" dir="rtl">
			<h4 class="fw-bold mb-3">Swipe to Read – החלקה לסימון כנקרא</h4>

			<form role="form" class="swipe-to-read-settings">
				<div class="mb-3">
					<label class="form-label" for="threshold">כמה צריך להחליק (אחוז מרוחב השורה)</label>
					<input type="number" min="10" max="90" step="5" id="threshold" name="threshold" class="form-control" placeholder="35">
				</div>

				<div class="mb-3">
					<label class="form-label" for="scope">איפה לאפשר החלקה</label>
					<select id="scope" name="scope" class="form-select">
						<option value="unread">רק בעמוד "לא נקראו" (/unread)</option>
						<option value="all">בכל רשימת נושאים – על נושאים שלא נקראו</option>
					</select>
				</div>
			</form>

			<button id="save" class="btn btn-primary">שמור הגדרות</button>
		</div>
	</div>
</div>
