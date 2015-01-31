moo/templates/style.min.css: moo/static/style.css
	@cleancss $< > $@

clean:
	@python setup.py clean

wheel:
	@python setup.py bdist_wheel

.PHONY: clean wheel
