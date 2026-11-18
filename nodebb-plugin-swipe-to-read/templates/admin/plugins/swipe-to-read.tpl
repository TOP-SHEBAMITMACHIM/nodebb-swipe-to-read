<div class="acp-page-container">
	<div class="row m-0">
		<div class="col-12 col-md-8 px-0">
			<h4 class="fw-bold mb-3">[[swipe-to-read:title]]</h4>

			<form role="form" class="swipe-to-read-settings">
				<div class="mb-3">
					<label class="form-label" for="threshold">[[swipe-to-read:threshold]]</label>
					<input type="number" min="10" max="90" step="5" id="threshold" name="threshold" class="form-control" placeholder="35">
				</div>

				<div class="mb-3">
					<label class="form-label" for="scope">[[swipe-to-read:scope]]</label>
					<select id="scope" name="scope" class="form-select">
						<option value="unread">[[swipe-to-read:scope-unread]]</option>
						<option value="all">[[swipe-to-read:scope-all]]</option>
					</select>
				</div>
			</form>

			<button id="save" class="btn btn-primary">[[swipe-to-read:save]]</button>
		</div>
	</div>
</div>
