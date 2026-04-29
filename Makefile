report:
	pdflatex report.tex
	pdflatex report.tex

clean:
	rm -f *.aux *.log *.out *.toc

open:
	xdg-open report.pdf

.PHONY : report clean open
